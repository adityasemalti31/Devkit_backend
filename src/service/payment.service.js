const crypto = require("crypto");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");

const Payment = require("../models/payment.model");
const User = require("../models/user.model");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
  pro_monthly: {
    name: "DevKit Premium Monthly",
    amount: 29900,
    billingCycle: "monthly",
    razorpayPlanId: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
  },
  pro_yearly: {
    name: "DevKit Premium Yearly",
    amount: 299900,
    billingCycle: "yearly",
    razorpayPlanId: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID,
  },
  pro: {
    name: "DevKit Premium Monthly",
    amount: 29900,
    billingCycle: "monthly",
    razorpayPlanId: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
  },
  premium: {
    name: "DevKit Premium Monthly",
    amount: 29900,
    billingCycle: "monthly",
    razorpayPlanId: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
  },
  premium_monthly: {
    name: "DevKit Premium Monthly",
    amount: 29900,
    billingCycle: "monthly",
    razorpayPlanId: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID,
  },
  premium_yearly: {
    name: "DevKit Premium Yearly",
    amount: 299900,
    billingCycle: "yearly",
    razorpayPlanId: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID,
  },
};

const SOURCE_CODES = {
  project_alpha: {
    name: "Project Alpha Source Code",
    amount: 49900,
  },
};

const CONTRIBUTION_MIN = 2000;
const CONTRIBUTION_MAX = 1000000;

function assertConfig() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured");
  }
}

function verifyHmac(message, signature) {
  if (typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) {
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

function validateIdempotencyKey(idempotencyKey) {
  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.length < 16 ||
    idempotencyKey.length > 128
  ) {
    throw new Error("A valid idempotencyKey is required");
  }
}

function serializePayment(payment) {
  return {
    paymentId: payment._id,
    type: payment.type,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    orderId: payment.gateway?.razorpayOrderId || null,
    subscriptionId: payment.gateway?.razorpaySubscriptionId || null,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
}

async function createPayment({
  userId,
  type,
  itemCode,
  contributionAmount,
  idempotencyKey,
}) {
  assertConfig();
  validateIdempotencyKey(idempotencyKey);

  const isContribution = type === "contribution";
  let normalizedUserId = null;

  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId");
    }

    normalizedUserId = new mongoose.Types.ObjectId(userId);
  }

  if (!isContribution && !normalizedUserId) {
    throw new Error("Login is required for this payment");
  }

  if (!["subscription", "contribution", "source_code"].includes(type)) {
    throw new Error("Unsupported payment type");
  }

  const existingQuery = {
    idempotencyKey,
    ...(normalizedUserId
      ? { user: normalizedUserId }
      : { user: { $exists: false } }),
  };

  const existing = await Payment.findOne(existingQuery);

  if (existing) {
    if (existing.type !== type) {
      throw new Error("Idempotency key was already used for another payment");
    }

    if (existing.status === "created" || existing.status === "pending") {
      if (
        existing.gateway?.razorpayOrderId ||
        existing.gateway?.razorpaySubscriptionId
      ) {
        return serializePayment(existing);
      }

      throw new Error(
        "Payment creation is being reconciled. Please retry shortly.",
      );
    }

    if (existing.status === "captured") {
      throw new Error("This payment has already been completed");
    }

    throw new Error("This idempotency key cannot be reused");
  }

  let amount;
  let name;
  let planCode = null;
  let billingCycle = null;
  let razorpayPlanId = null;
  let resourceId = null;

  if (type === "subscription") {
    const selectedCode = (itemCode && PLANS[itemCode]) ? itemCode : "pro_monthly";
    const plan = PLANS[selectedCode];

    if (!plan) {
      throw new Error("Invalid subscription plan");
    }

    ({ name, amount, billingCycle } = plan);
    planCode = selectedCode;
    razorpayPlanId = plan.razorpayPlanId || null;
  } else if (isContribution) {
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
  }

  const payment = new Payment({
    ...(normalizedUserId ? { user: normalizedUserId } : {}),
    type,
    purpose: {
      name,
      itemCode: itemCode || null,
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
        changedAt: new Date(),
      },
    ],
  });

  await payment.save();

  try {
    if (type === "subscription" && razorpayPlanId) {
      try {
        const subscription = await razorpay.subscriptions.create({
          plan_id: razorpayPlanId,
          total_count: billingCycle === "yearly" ? 10 : 120,
          quantity: 1,
          customer_notify: 1,
          notes: {
            paymentRecordId: payment._id.toString(),
            userId: normalizedUserId.toString(),
            itemCode: planCode,
          },
        });

        payment.gateway.razorpaySubscriptionId = subscription.id;
        addHistory(payment, "pending", "system", "Razorpay subscription created");
      } catch (subErr) {
        console.warn("Razorpay subscription creation failed, falling back to Order:", subErr.message);
        const order = await razorpay.orders.create({
          amount,
          currency: "INR",
          receipt: payment._id.toString().slice(-40),
          notes: {
            paymentRecordId: payment._id.toString(),
            userId: normalizedUserId ? normalizedUserId.toString() : "anonymous",
            type,
            itemCode: planCode || "",
          },
        });

        payment.gateway.razorpayOrderId = order.id;
        addHistory(payment, "pending", "system", "Razorpay order created for subscription fallback");
      }
    } else {
      const order = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: payment._id.toString().slice(-40),
        notes: {
          paymentRecordId: payment._id.toString(),
          userId: normalizedUserId ? normalizedUserId.toString() : "anonymous",
          type,
          itemCode: itemCode || planCode || "",
        },
      });

      payment.gateway.razorpayOrderId = order.id;
      addHistory(payment, "pending", "system", `Razorpay order created for ${type}`);
    }

    await payment.save();

    return serializePayment(payment);
  } catch (error) {
    console.error("PAYMENT CREATION ERROR:", error);
    if (
      process.env.RAZORPAY_KEY_ID === "your_key_id" ||
      (error.error && error.error.description?.includes("Unauthorized"))
    ) {
      throw new Error(
        "Razorpay credentials not yet configured. Please add your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in starterKit-backend/.env."
      );
    }
    throw new Error(error.message || "Unable to complete checkout creation");
  }
}

async function verifyPayment({
  userId,
  razorpay_order_id,
  razorpay_subscription_id,
  razorpay_payment_id,
  razorpay_signature,
  allowAnonymous = false,
}) {
  assertConfig();

  if (
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    throw new Error("Missing payment verification details");
  }

  const isSubscription = Boolean(razorpay_subscription_id);

  if (allowAnonymous && (isSubscription || userId)) {
    throw new Error("Invalid anonymous payment verification request");
  }

  if (!allowAnonymous && !userId) {
    throw new Error("Login is required to verify this payment");
  }

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId");
  }

  if (isSubscription && typeof razorpay_subscription_id !== "string") {
    throw new Error("Invalid subscription reference");
  }

  if (!isSubscription && typeof razorpay_order_id !== "string") {
    throw new Error("Invalid order reference");
  }

  const lookup = isSubscription
    ? {
        "gateway.razorpaySubscriptionId": razorpay_subscription_id,
        type: "subscription",
      }
    : {
        "gateway.razorpayOrderId": razorpay_order_id,
      };

  if (allowAnonymous) {
    lookup.type = "contribution";
    lookup.user = { $exists: false };
  } else {
    lookup.user = new mongoose.Types.ObjectId(userId);
  }

  const payment = await Payment.findOne(lookup);

  if (!payment) {
    throw new Error("Payment record not found");
  }

  if (payment.type !== "contribution" && !payment.user) {
    throw new Error("Authenticated payment record required");
  }

  if (allowAnonymous && payment.type !== "contribution") {
    throw new Error("Anonymous verification is only allowed for contributions");
  }

  const gatewayId = isSubscription
    ? payment.gateway.razorpaySubscriptionId
    : payment.gateway.razorpayOrderId;

  if (!gatewayId) {
    throw new Error("Payment reference not found");
  }

  const signatureMessage = isSubscription
    ? `${razorpay_payment_id}|${gatewayId}`
    : `${gatewayId}|${razorpay_payment_id}`;

  if (!verifyHmac(signatureMessage, razorpay_signature)) {
    throw new Error("Invalid payment signature");
  }

  if (payment.status === "captured") {
    if (
      payment.gateway.razorpayPaymentId === razorpay_payment_id &&
      payment.gateway.razorpaySignatureVerified
    ) {
      return {
        paymentId: payment._id,
        status: payment.status,
        type: payment.type,
        alreadyVerified: true,
      };
    }

    throw new Error("Payment has already been verified");
  }

  if (
    [
      "refunded",
      "partially_refunded",
      "cancelled",
      "expired",
      "failed",
    ].includes(payment.status)
  ) {
    throw new Error("Payment is no longer eligible for verification");
  }

  const gatewayPayment = await razorpay.payments.fetch(razorpay_payment_id);

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

  payment.gateway.razorpayPaymentId = razorpay_payment_id;
  payment.gateway.razorpaySignatureVerified = true;
  payment.capturedAt = new Date();

  addHistory(
    payment,
    "captured",
    "system",
    "Checkout signature and captured payment verified",
  );

  await payment.save();

  let userSubscription = null;
  if (payment.type === "subscription" && payment.user) {
    const expiresAt = new Date();
    if (payment.subscription?.billingCycle === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const updatedUser = await User.findByIdAndUpdate(
      payment.user,
      {
        "subscription.plan": "pro",
        "subscription.status": "active",
        "subscription.startedAt": new Date(),
        "subscription.expiresAt": expiresAt,
        "subscription.paymentId": razorpay_payment_id,
      },
      { new: true }
    );

    if (updatedUser) {
      userSubscription = updatedUser.subscription;
    }
  }

  return {
    paymentId: payment._id,
    status: payment.status,
    type: payment.type,
    subscription: userSubscription || (payment.type === "subscription" ? { plan: "pro", status: "active" } : null),
  };
}

module.exports = {
  createPayment,
  verifyPayment,
};
