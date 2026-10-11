const paymentService = require("../service/payment.service");

const createPayment = async (req, res, next) => {
  try {
    const { type, itemCode, contributionAmount, idempotencyKey } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!idempotencyKey) {
      return res.status(400).json({
        success: false,
        message: "Idempotency key is required",
      });
    }

    if (!["subscription", "source_code"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported payment type for this endpoint",
      });
    }

    if (!itemCode || typeof itemCode !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid itemCode is required",
      });
    }

    const result = await paymentService.createPayment({
      userId,
      type,
      itemCode,
      idempotencyKey,
    });

    return res.status(201).json({
      success: true,
      message: "Checkout created successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (
      !razorpay_payment_id ||
      !razorpay_signature ||
      (!razorpay_order_id && !razorpay_subscription_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Required payment verification details are missing",
      });
    }

    const result = await paymentService.verifyPayment({
      userId,
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const createContribution = async (req, res, next) => {
  try {
    const { contributionAmount, idempotencyKey } = req.body;

    if (
      !Number.isSafeInteger(contributionAmount) ||
      contributionAmount < 2000 ||
      contributionAmount > 1000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Contribution must be between ₹20 and ₹10,000",
      });
    }

    if (
      typeof idempotencyKey !== "string" ||
      idempotencyKey.length < 16 ||
      idempotencyKey.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid idempotencyKey is required",
      });
    }

    const result = await paymentService.createPayment({
      type: "contribution",
      contributionAmount,
      idempotencyKey,
    });

    return res.status(201).json({
      success: true,
      message: "Contribution checkout created successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

const verifyContribution = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Required contribution verification details are missing",
      });
    }

    const result = await paymentService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      allowAnonymous: true,
    });

    return res.status(200).json({
      success: true,
      message: "Contribution verified successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPayment,
  verifyPayment,
  createContribution,
  verifyContribution,
};
