
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Payment = require("../models/payment.model");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Trusted server-side price catalog.
// Replace example prices/product entries with your actual catalog.
const PLANS = {
  pro_monthly: {
    name: "DevKit Pro Monthly",
    amount: 29900,
    billingCycle: "monthly",
    razorpayPlanId: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
  },
  pro_yearly: {
    name: "DevKit Pro Yearly",
    amount: 299900,
    billingCycle: "yearly",
    razorpayPlanId: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID,
  },
};

const SOURCE_CODES = {
  // Example entry. Replace with your actual project catalog.
  project_alpha: {
    name: "Project Alpha Source Code",
    amount: 49900,
  },
};

const CONTRIBUTION_MIN = 2000;   // ₹20
const CONTRIBUTION_MAX = 1000000; // ₹10,000

function assertConfig() {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    throw new Error("Razorpay credentials are not configured");
  }
}

function verifyHmac(message, signature) {
  if (
    typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/i.test(signature)
  ) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(message)
    .digest();

  const received = Buffer.from(signature, "hex");

  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
}

function addHistory(payment, status, source, reason) {
  payment.status = status;
  payment.statusHistory.push({
    status,
    source,
    reason,
    changedAt: new Date(),
  });
}

// Create a local record before contacting Razorpay.
async function createPayment({
  userId,
  type,
  itemCode,
  contributionAmount,
  idempotencyKey,
}) {
  assertConfig();

  if (!userId || !mongooseIdIsValid(userId)) {
    throw new Error("Valid userId is required");
  }

  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.length < 16 ||
    idempotencyKey.length > 128
  ) {
    throw new Error("A valid idempotencyKey is required");
  }

  // A retry with the same key must not create a new payment record.
  const existing = await Payment.findOne({
    user: userId,
    idempotencyKey,
  });

  if (existing) {
    return existing;
  }

  let amount;
  let name;
  let planCode = null;
  let billingCycle = null;
  let razorpayPlanId = null;
  let resourceId = null;

  if (type === "subscription") {
    const plan = PLANS[itemCode];

    if (!plan || !plan.razorpayPlanId) {
      throw new Error("Invalid or unconfigured subscription plan");
    }

    ({ name, amount, billingCycle } = plan);
    planCode = itemCode;
    razorpayPlanId = plan.razorpayPlanId;
  } else if (type === "contribution") {
    if (
      !Number.isSafeInteger(contributionAmount) ||
      contributionAmount < CONTRIBUTION_MIN ||
      contributionAmount > CONTRIBUTION_MAX
    ) {
      throw new Error("Contribution amount is outside allowed limits");
    }

    amount = contributionAmount;
    name = "Support DevKit";
  } else if (type === "source_code") {
    const product = SOURCE_CODES[itemCode];

    if (!product) {
      throw new Error("Invalid source code product");
    }

    ({ name, amount } = product);
    resourceId = null; // Resolve the real resource ID from your DB.
  } else {
    throw new Error("Unsupported payment type");
  }

  const payment = await Payment.create({
    user: userId,
    type,
    purpose: {
      name,
      itemCode,
      resourceId,
      metadata: {},
    },
    amount,
    currency: "INR",
    status: "created",
    idempotencyKey,
    subscription: {
      planCode,
      billingCycle,
    },
    statusHistory: [
      {
        status: "created",
        source: "system",
        reason: "Checkout initiated",
      },
    ],
  });

  try {
    if (type === "subscription") {
      const subscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        total_count: 120,
        quantity: 1,
        customer_notify: 1,
        notes: {
          paymentRecordId: payment._id.toString(),
          userId: userId.toString(),
          itemCode,
        },
      });

      payment.gateway.razorpaySubscriptionId = subscription.id;
      payment.status = "pending";
      payment.statusHistory.push({
        status: "pending",
        source: "system",
        reason: "Razorpay subscription created",
      });
    } else {
      const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: payment._id.toString(),
        notes: {
          paymentRecordId: payment._id.toString(),
          userId: userId.toString(),
          type,
          itemCode,
        },
      });

      payment.gateway.razorpayOrderId = order.id;
      payment.status = "pending";
      payment.statusHistory.push({
        status: "pending",
        source: "system",
        reason: "Razorpay order created",
      });
    }

    await payment.save();

    // Never return the key secret or the full payment document.
    return {
      paymentId: payment._id,
      type: payment.type,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      orderId: payment.gateway.razorpayOrderId,
      subscriptionId: payment.gateway.razorpaySubscriptionId,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    // The gateway may have created a resource even if saving failed.
    // Reconcile such cases instead of blindly retrying a new checkout.
    console.error("Payment creation needs reconciliation:", {
      paymentId: payment._id.toString(),
      message: error.message,
    });

    throw new Error("Unable to complete checkout creation");
  }
}

// Verify checkout signature and confirm the gateway's actual payment state.
async function verifyPayment({
  userId,
  razorpay_order_id,
  razorpay_subscription_id,
  razorpay_payment_id,
  razorpay_signature,
}) {
  assertConfig();

  if (
    !userId ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    throw new Error("Missing payment verification details");
  }

  const isSubscription = Boolean(razorpay_subscription_id);

  const payment = await Payment.findOne({
    user: userId,
    ...(isSubscription
      ? {
          "gateway.razorpaySubscriptionId":
            razorpay_subscription_id,
        }
      : {
          "gateway.razorpayOrderId": razorpay_order_id,
        }),
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  // Verify using the gateway ID stored on our server.
  const gatewayId = isSubscription
    ? payment.gateway.razorpaySubscriptionId
    : payment.gateway.razorpayOrderId;

  if (
    !gatewayId ||
    (isSubscription
      ? gatewayId !== razorpay_subscription_id
      : gatewayId !== razorpay_order_id)
  ) {
    throw new Error("Payment reference mismatch");
  }

  const signatureMessage = isSubscription
    ? `${razorpay_payment_id}|${gatewayId}`
    : `${gatewayId}|${razorpay_payment_id}`;

  if (!verifyHmac(signatureMessage, razorpay_signature)) {
    throw new Error("Invalid payment signature");
  }

  // A valid signature alone does not prove that the payment was captured.
  const gatewayPayment = await razorpay.payments.fetch(
    razorpay_payment_id
  );

  if (
    gatewayPayment.status !== "captured" ||
    gatewayPayment.amount !== payment.amount ||
    gatewayPayment.currency !== payment.currency
  ) {
    throw new Error("Payment is not captured or details do not match");
  }

  if (isSubscription) {
    if (
      gatewayPayment.subscription_id &&
      gatewayPayment.subscription_id !== gatewayId
    ) {
      throw new Error("Subscription reference mismatch");
    }
  } else if (gatewayPayment.order_id !== gatewayId) {
    throw new Error("Order reference mismatch");
  }

  // Do not overwrite an already verified payment with a new status.
  if (payment.status === "captured") {
    return {
      paymentId: payment._id,
      status: payment.status,
      alreadyVerified: true,
    };
  }

  if (
    ["refunded", "partially_refunded", "cancelled", "expired"].includes(
      payment.status
    )
  ) {
    throw new Error("Payment is no longer eligible for verification");
  }

  payment.gateway.razorpayPaymentId = razorpay_payment_id;
  payment.gateway.razorpaySignatureVerified = true;
  payment.capturedAt = new Date();

  addHistory(
    payment,
    "captured",
    "system",
    "Checkout signature and captured payment verified"
  );

  await payment.save();

  // IMPORTANT:
  // Activate subscriptions / grant source-code access through
  // a separate idempotent entitlement service or verified webhooks.
  // Do not grant access from an unverified frontend callback.

  return {
    paymentId: payment._id,
    status: payment.status,
    type: payment.type,
  };
}

// Keep the helper explicit instead of silently accepting malformed IDs.
function mongooseIdIsValid(id) {
  return require("mongoose").Types.ObjectId.isValid(id);
}

module.exports = {
  createPayment,
  verifyPayment,
};