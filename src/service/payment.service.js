const crypto = require("crypto");
const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const User = require("../models/user.model");

const CASHFREE_API_VERSION = "2025-01-01";

const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "PRODUCTION"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const CONTRIBUTION_MIN = 2000;
const CONTRIBUTION_MAX = 1000000;

const PLANS = {
  pro_monthly: {
    code: "pro_monthly",
    name: "Pro Monthly Subscription",
    amount: 29900,
    billingCycle: "monthly",
    durationDays: 30,
  },
  pro_yearly: {
    code: "pro_yearly",
    name: "Pro Yearly Subscription",
    amount: 299900,
    billingCycle: "yearly",
    durationDays: 365,
  },
  pro: {
    code: "pro_monthly",
    name: "Pro Monthly Subscription",
    amount: 29900,
    billingCycle: "monthly",
    durationDays: 30,
  },
  premium: {
    code: "pro_monthly",
    name: "Pro Monthly Subscription",
    amount: 29900,
    billingCycle: "monthly",
    durationDays: 30,
  },
  premium_monthly: {
    code: "pro_monthly",
    name: "Pro Monthly Subscription",
    amount: 29900,
    billingCycle: "monthly",
    durationDays: 30,
  },
  premium_yearly: {
    code: "pro_yearly",
    name: "Pro Yearly Subscription",
    amount: 299900,
    billingCycle: "yearly",
    durationDays: 365,
  },
};

const SOURCE_CODES = {
  project_alpha: {
    code: "project_alpha",
    name: "Project Alpha Source Code",
    amount: 49900,
  },
};

function assertConfig() {
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    throw new Error("Cashfree credentials are missing in environment variables");
  }
}

function validateIdempotencyKey(key) {
  if (
    typeof key !== "string" ||
    key.length < 16 ||
    key.length > 128 ||
    !/^[a-zA-Z0-9_-]+$/.test(key)
  ) {
    const error = new Error("A valid idempotency key is required");
    error.statusCode = 400;
    throw error;
  }
}

async function cashfreeRequest(path, options = {}) {
  assertConfig();

  const response = await fetch(`${CASHFREE_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": CASHFREE_API_VERSION,
      "x-client-id": process.env.CASHFREE_APP_ID,
      "x-client-secret": process.env.CASHFREE_SECRET_KEY,
      ...(options.headers || {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const responseText = await response.text();
  let data = {};

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = { message: responseText };
  }

  if (!response.ok) {
    const error = new Error(
      data.message ||
        data.type ||
        `Cashfree request failed with status ${response.status}`
    );

    error.statusCode = response.status >= 500 ? 502 : response.status;
    error.cashfreeResponse = data;
    throw error;
  }

  return data;
}

function addHistory(payment, status, source = "system", reason = "") {
  payment.status = status;

  payment.statusHistory.push({
    status,
    source,
    reason,
    changedAt: new Date(),
  });
}

function serializePayment(payment) {
  return {
    paymentId: payment._id.toString(),
    type: payment.type,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    orderId: payment.gateway?.cashfreeOrderId || null,
    paymentSessionId: payment.gateway?.cashfreePaymentSessionId || null,
    environment:
      process.env.CASHFREE_ENV === "PRODUCTION" ? "production" : "sandbox",
  };
}

function getCustomerDetails(userId, user, payment) {
  const rawPhone =
    user?.phone ||
    user?.mobile ||
    user?.phoneNumber ||
    user?.mobileNumber;

  const phone = rawPhone ? String(rawPhone).replace(/\D/g, "") : "";

  if (phone.length < 10) {
    const error = new Error(
      "A valid customer phone number is required for Cashfree checkout"
    );
    error.statusCode = 400;
    throw error;
  }

  const rawEmail = user?.email || user?.emailAddress || "";
  const email = String(rawEmail).trim();

  if (!email) {
    const error = new Error("Customer email is required for Cashfree checkout");
    error.statusCode = 400;
    throw error;
  }

  return {
    customer_id: String(userId || payment._id).replace(/[^a-zA-Z0-9_-]/g, ""),
    customer_name: String(
      user?.name || user?.fullName || user?.username || "Customer"
    ).slice(0, 100),
    customer_email: email,
    customer_phone: phone.slice(-10),
  };
}

function getPaymentDefinition({ type, itemCode, contributionAmount }) {
  if (type === "subscription") {
    const plan = PLANS[itemCode];

    if (!plan) {
      const error = new Error("Invalid subscription plan");
      error.statusCode = 400;
      throw error;
    }

    return {
      type,
      itemCode: plan.code,
      name: plan.name,
      amount: plan.amount,
      plan,
    };
  }

  if (type === "source_code") {
    const item = SOURCE_CODES[itemCode];

    if (!item) {
      const error = new Error("Invalid source-code item");
      error.statusCode = 400;
      throw error;
    }

    return {
      type,
      itemCode: item.code,
      name: item.name,
      amount: item.amount,
    };
  }

  if (type === "contribution") {
    const amount = Number(contributionAmount);

    if (
      !Number.isSafeInteger(amount) ||
      amount < CONTRIBUTION_MIN ||
      amount > CONTRIBUTION_MAX
    ) {
      const error = new Error(
        "Contribution must be between ₹20 and ₹10,000"
      );
      error.statusCode = 400;
      throw error;
    }

    return {
      type,
      itemCode: null,
      name: "Contribution",
      amount,
    };
  }

  const error = new Error("Unsupported payment type");
  error.statusCode = 400;
  throw error;
}

async function findExistingPayment({ userId, idempotencyKey, type }) {
  const query = {
    idempotencyKey,
    type,
  };

  if (userId) {
    query.user = userId;
  } else {
    query.user = { $exists: false };
  }

  return Payment.findOne(query);
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

  if (userId && !mongoose.isValidObjectId(userId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  const definition = getPaymentDefinition({
    type,
    itemCode,
    contributionAmount,
  });

  let existing = await findExistingPayment({
    userId,
    idempotencyKey,
    type,
  });

  if (existing) {
    if (existing.gateway?.cashfreePaymentSessionId) {
      return serializePayment(existing);
    }

    if (
      existing.status === "captured" ||
      existing.status === "failed" ||
      existing.status === "cancelled" ||
      existing.status === "expired"
    ) {
      const error = new Error(
        "This idempotency key has already been used. Generate a new key."
      );
      error.statusCode = 409;
      throw error;
    }
  }

  let user = null;

  if (userId) {
    user = await User.findById(userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
  }

  const now = new Date();

  let payment = existing;

  if (!payment) {
    payment = new Payment({
      ...(userId ? { user: userId } : {}),
      type: definition.type,
      purpose: {
        name: definition.name,
        itemCode: definition.itemCode,
        metadata: {},
      },
      amount: definition.amount,
      currency: "INR",
      status: "created",
      gateway: {
        provider: "cashfree",
      },
      subscription: definition.plan
        ? {
            planCode: definition.plan.code,
            billingCycle: definition.plan.billingCycle,
            periodStart: null,
            periodEnd: null,
          }
        : undefined,
      idempotencyKey,
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
      statusHistory: [
        {
          status: "created",
          source: "system",
          reason: "Payment initialized",
          changedAt: now,
        },
      ],
    });

    await payment.save();
  }

  const orderId = `cf_${payment._id.toString()}`;

  try {
    const customerDetails = getCustomerDetails(userId, user, payment);

    const origin =
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      process.env.WEBSITE_URL;

    const body = {
      order_id: orderId,
      order_amount: Number((definition.amount / 100).toFixed(2)),
      order_currency: "INR",
      customer_details: customerDetails,
      order_note: definition.name.slice(0, 250),
      order_meta: {
        ...(origin
          ? {
              return_url: `${origin.replace(/\/$/, "")}/payment/return?order_id=${orderId}`,
            }
          : {}),
      },
    };

    const order = await cashfreeRequest("/orders", {
      method: "POST",
      body,
    });

    if (!order.payment_session_id || !order.order_id) {
      throw new Error("Cashfree did not return a valid payment session");
    }

    payment.gateway.provider = "cashfree";
    payment.gateway.cashfreeOrderId = order.order_id;
    payment.gateway.cashfreePaymentSessionId = order.payment_session_id;

    addHistory(
      payment,
      "pending",
      "system",
      "Cashfree order created"
    );

    await payment.save();

    return serializePayment(payment);
  } catch (error) {
    if (payment.status !== "captured") {
      payment.failure = {
        code: "CASHFREE_ORDER_CREATION_FAILED",
        description: String(error.message || "Order creation failed").slice(
          0,
          500
        ),
        failedAt: new Date(),
      };

      addHistory(
        payment,
        "failed",
        "system",
        "Cashfree order creation failed"
      );

      await payment.save().catch(() => {});
    }

    throw error;
  }
}

async function verifyPayment({ userId, orderId }) {
  assertConfig();

  if (!orderId || typeof orderId !== "string") {
    const error = new Error("Cashfree order ID is required");
    error.statusCode = 400;
    throw error;
  }

  const payment = await Payment.findOne({
    "gateway.cashfreeOrderId": orderId,
    ...(userId ? { user: userId } : {}),
  });

  if (!payment) {
    const error = new Error("Payment record not found");
    error.statusCode = 404;
    throw error;
  }

  if (payment.status === "captured") {
    return {
      ...serializePayment(payment),
      verified: true,
    };
  }

  const order = await cashfreeRequest(
    `/orders/${encodeURIComponent(orderId)}`
  );

  if (order.order_id !== orderId) {
    const error = new Error("Cashfree order ID mismatch");
    error.statusCode = 400;
    throw error;
  }

  const cashfreeAmount = Math.round(Number(order.order_amount) * 100);

  if (
    !Number.isSafeInteger(cashfreeAmount) ||
    cashfreeAmount !== payment.amount ||
    order.order_currency !== payment.currency
  ) {
    const error = new Error("Payment amount or currency mismatch");
    error.statusCode = 400;
    throw error;
  }

  if (order.order_status !== "PAID") {
    if (
      order.order_status === "EXPIRED" ||
      order.order_status === "TERMINATED"
    ) {
      addHistory(
        payment,
        "expired",
        "reconciliation",
        `Cashfree order status: ${order.order_status}`
      );
      await payment.save();
    }

    return {
      ...serializePayment(payment),
      verified: false,
      gatewayStatus: order.order_status,
    };
  }

  const payments = await cashfreeRequest(
    `/orders/${encodeURIComponent(orderId)}/payments`
  );

  const successfulPayment = Array.isArray(payments)
    ? payments.find(
        (entry) =>
          entry.payment_status === "SUCCESS" &&
          entry.payment_currency === payment.currency &&
          Math.round(Number(entry.payment_amount) * 100) === payment.amount
      )
    : null;

  if (!successfulPayment) {
    const error = new Error(
      "Cashfree order is marked paid but no matching successful payment was found"
    );
    error.statusCode = 409;
    throw error;
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const freshPayment = await Payment.findById(payment._id).session(
        session
      );

      if (!freshPayment) {
        throw new Error("Payment record not found");
      }

      if (freshPayment.status === "captured") {
        return;
      }

      if (
        freshPayment.gateway?.cashfreeOrderId !== orderId ||
        freshPayment.amount !== payment.amount
      ) {
        throw new Error("Payment record changed during verification");
      }

      freshPayment.gateway.cashfreePaymentId = String(
        successfulPayment.cf_payment_id
      );

      addHistory(
        freshPayment,
        "captured",
        "reconciliation",
        "Cashfree payment verified successfully"
      );

      freshPayment.capturedAt = new Date();
      freshPayment.failure = {
        code: null,
        description: null,
        failedAt: null,
      };

      if (freshPayment.type === "subscription") {
        const plan = PLANS[freshPayment.subscription?.planCode];

        if (!plan) {
          throw new Error("Subscription plan configuration not found");
        }

        const currentUser = await User.findById(freshPayment.user).session(
          session
        );

        if (!currentUser) {
          throw new Error("User not found while activating subscription");
        }

        const currentExpiry = currentUser.subscription?.expiresAt
          ? new Date(currentUser.subscription.expiresAt)
          : null;

        const startDate =
          currentExpiry && currentExpiry > new Date()
            ? currentExpiry
            : new Date();

        const expiresAt = new Date(startDate);
        expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

        currentUser.subscription = {
          ...(currentUser.subscription?.toObject?.() ||
            currentUser.subscription ||
            {}),
          plan: "pro",
          status: "active",
          expiresAt,
        };

        currentUser.markModified("subscription");
        await currentUser.save({ session });

        freshPayment.subscription.periodStart = startDate;
        freshPayment.subscription.periodEnd = expiresAt;
      }

      await freshPayment.save({ session });
    });
  } finally {
    await session.endSession();
  }

  const updatedPayment = await Payment.findById(payment._id);

  return {
    ...serializePayment(updatedPayment),
    verified: updatedPayment.status === "captured",
  };
}

function verifyCashfreeWebhookSignature({
  rawBody,
  timestamp,
  signature,
}) {
  if (!rawBody || !timestamp || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", process.env.CASHFREE_SECRET_KEY)
    .update(String(timestamp) + rawBody)
    .digest("base64");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(String(signature));

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

async function handleCashfreeWebhook({
  rawBody,
  timestamp,
  signature,
  event,
}) {
  assertConfig();

  if (
    !verifyCashfreeWebhookSignature({
      rawBody,
      timestamp,
      signature,
    })
  ) {
    const error = new Error("Invalid Cashfree webhook signature");
    error.statusCode = 401;
    throw error;
  }

  const payload = event || JSON.parse(rawBody);
  const data = payload.data || {};
  const orderData = data.order || {};
  const paymentData = data.payment || {};

  const orderId = orderData.order_id;

  if (!orderId) {
    return { received: true, ignored: true };
  }

  const payment = await Payment.findOne({
    "gateway.cashfreeOrderId": orderId,
  });

  if (!payment) {
    return { received: true, ignored: true };
  }

  const eventType = String(payload.type || "");
  const eventTime = payload.event_time
    ? new Date(payload.event_time)
    : new Date();

  if (
    payment.gateway.lastWebhookAt &&
    eventTime <= payment.gateway.lastWebhookAt
  ) {
    return { received: true, duplicate: true };
  }

  payment.gateway.lastWebhookEventId =
    payload.id || payload.event_id || null;
  payment.gateway.lastWebhookEventType = eventType;
  payment.gateway.lastWebhookAt = eventTime;

  if (
    eventType.includes("PAYMENT_SUCCESS") &&
    paymentData.payment_status === "SUCCESS"
  ) {
    const result = await verifyPayment({
      userId: payment.user ? payment.user.toString() : undefined,
      orderId,
    });

    return { received: true, verified: result.verified };
  }

  if (eventType.includes("PAYMENT_FAILED")) {
    if (payment.status !== "captured") {
      payment.failure = {
        code: String(paymentData.payment_status || "PAYMENT_FAILED"),
        description: String(
          paymentData.payment_message || "Cashfree payment failed"
        ).slice(0, 500),
        failedAt: new Date(),
      };

      addHistory(
        payment,
        "failed",
        "webhook",
        "Cashfree reported payment failure"
      );
    }
  }

  await payment.save();

  return { received: true };
}

async function verifyContribution({ orderId }) {
  return verifyPayment({ orderId });
}

module.exports = {
  createPayment,
  verifyPayment,
  verifyContribution,
  handleCashfreeWebhook,
};