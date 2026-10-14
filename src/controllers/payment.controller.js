const paymentService = require("../service/payment.service");
function sendError(res, error) {
  console.error("Payment error:", {
    message: error.message,
    statusCode: error.statusCode,
    cashfreeResponse: error.cashfreeResponse,
  });

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Payment processing failed",
  });
}

exports.createPayment = async (req, res) => {
  try {
    const {
      type,
      itemCode,
      idempotencyKey,
      customerPhone,
      customerEmail,
      customerName,
      phone,
      email,
      name,
    } = req.body;

    if (!["subscription", "source_code"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type",
      });
    }

    if (!itemCode || !idempotencyKey) {
      return res.status(400).json({
        success: false,
        message: "itemCode and idempotencyKey are required",
      });
    }

    const payment = await paymentService.createPayment({
      userId: req.user?._id || req.user?.id,
      type,
      itemCode,
      idempotencyKey,
      customerPhone: customerPhone || phone,
      customerEmail: customerEmail || email || req.user?.email,
      customerName: customerName || name || req.user?.name,
    });

    return res.status(201).json({
      success: true,
      message: "Cashfree payment order created",
      data: payment,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const orderId =
      req.body.orderId ||
      req.body.order_id ||
      req.query.order_id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Cashfree orderId is required",
      });
    }

    const result = await paymentService.verifyPayment({
      userId: req.user?._id || req.user?.id,
      orderId,
    });

    return res.status(result.verified ? 200 : 202).json({
      success: true,
      message: result.verified
        ? "Payment verified successfully"
        : "Payment is not completed yet",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.createContribution = async (req, res) => {
  try {
    const {
      contributionAmount,
      idempotencyKey,
      customerPhone,
      customerEmail,
      customerName,
      phone,
      email,
      name,
    } = req.body;

    if (!Number.isSafeInteger(contributionAmount)) {
      return res.status(400).json({
        success: false,
        message: "Contribution amount must be an integer in paise",
      });
    }

    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        message: "idempotencyKey is required",
      });
    }

    const payment = await paymentService.createPayment({
      type: "contribution",
      contributionAmount,
      idempotencyKey,
      customerPhone: customerPhone || phone,
      customerEmail: customerEmail || email,
      customerName: customerName || name,
    });

    return res.status(201).json({
      success: true,
      message: "Contribution payment order created",
      data: payment,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.verifyContribution = async (req, res) => {
  try {
    const orderId =
      req.body.orderId ||
      req.body.order_id ||
      req.query.order_id;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Cashfree orderId is required",
      });
    }

    const result = await paymentService.verifyContribution({ orderId });

    return res.status(result.verified ? 200 : 202).json({
      success: true,
      message: result.verified
        ? "Contribution verified successfully"
        : "Contribution payment is not completed yet",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.cashfreeWebhook = async (req, res) => {
  try {
    const signature = req.get("x-webhook-signature");
    const timestamp = req.get("x-webhook-timestamp");

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Webhook raw body is not configured",
      });
    }

    const result = await paymentService.handleCashfreeWebhook({
      rawBody: req.body.toString("utf8"),
      timestamp,
      signature,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Cashfree webhook error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode === 401
          ? "Invalid webhook signature"
          : "Webhook processing failed",
    });
  }
};