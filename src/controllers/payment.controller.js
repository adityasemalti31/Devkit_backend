
const paymentService = require("../service/payment.service");

// Create checkout for subscription, contribution or source code.
const createPayment = async (req, res, next) => {
  try {
    const { type, itemCode, contributionAmount, idempotencyKey } =
      req.body;

    // User ID must come from authenticated middleware,
    // never trust a user ID supplied by the frontend.
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

    const result = await paymentService.createPayment({
      userId,
      type,
      itemCode,
      contributionAmount,
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

// Verify checkout payment after Razorpay Checkout returns.
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

module.exports = {
  createPayment,
  verifyPayment,
};