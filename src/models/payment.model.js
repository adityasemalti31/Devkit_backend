const mongoose = require("mongoose");

const { Schema } = mongoose;

const refundSchema = new Schema(
  {
    refundId: {
      type: String,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Refund amount must be an integer in paise",
      },
    },

    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
        "created",
        "pending",
        "authorized",
        "captured",
        "failed",
        "cancelled",
        "expired",
        "refunded",
        "partially_refunded",
      ],
    },

    source: {
      type: String,
      enum: ["system", "webhook", "admin", "reconciliation"],
      required: true,
    },

    reason: {
      type: String,
      maxlength: 500,
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const paymentSchema = new Schema(
  {
    // User who initiated the payment
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.type !== "contribution";
      },
      index: true,
    },

    // Purpose of this transaction
    type: {
      type: String,
      required: true,
      enum: [
        "subscription",
        "contribution",
        "source_code",
        "resource_purchase",
      ],
      index: true,
    },

    // What the user is paying for
    purpose: {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      // Stable internal identifier, e.g. "pro_monthly"
      itemCode: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      // Internal resource/project ID, when applicable
      resourceId: {
        type: Schema.Types.ObjectId,
        default: null,
      },

      // Snapshot of the product/plan at checkout
      metadata: {
        type: Schema.Types.Mixed,
        default: () => ({}),
      },
    },

    // Money is always stored in the smallest currency unit.
    // ₹299 = 29900 paise.
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Amount must be an integer in paise",
      },
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      enum: ["INR"],
      required: true,
    },

    status: {
      type: String,
      required: true,
      enum: [
        "created",
        "pending",
        "authorized",
        "captured",
        "failed",
        "cancelled",
        "expired",
        "refunded",
        "partially_refunded",
      ],
      default: "created",
      index: true,
    },

    // Gateway references and verification information
    gateway: {
      provider: {
        type: String,
        enum: ["razorpay"],
        default: "razorpay",
        required: true,
      },

      razorpayOrderId: {
        type: String,
        default: null,
      },

      razorpayPaymentId: {
        type: String,
        default: null,
      },

      razorpaySubscriptionId: {
        type: String,
        default: null,
      },

      razorpaySignatureVerified: {
        type: Boolean,
        default: false,
      },

      // Latest relevant webhook details.
      // Store individual webhook events in a separate collection.
      lastWebhookEventId: {
        type: String,
        default: null,
      },

      lastWebhookEventType: {
        type: String,
        default: null,
      },

      lastWebhookAt: {
        type: Date,
        default: null,
      },
    },

    // Optional recurring billing information
    subscription: {
      planCode: {
        type: String,
        default: null,
      },

      billingCycle: {
        type: String,
        enum: ["monthly", "yearly", null],
        default: null,
      },

      periodStart: {
        type: Date,
        default: null,
      },

      periodEnd: {
        type: Date,
        default: null,
      },
    },

    // Payment failure details; never store secrets here
    failure: {
      code: {
        type: String,
        default: null,
      },

      description: {
        type: String,
        maxlength: 500,
        default: null,
      },

      failedAt: {
        type: Date,
        default: null,
      },
    },

    // Multiple partial refunds can belong to one payment
    refunds: {
      type: [refundSchema],
      default: [],
    },

    // Unique per checkout attempt; helps prevent duplicate creation.
    idempotencyKey: {
      type: String,
      required: true,
      immutable: true,
    },

    // Optional checkout expiry
    expiresAt: {
      type: Date,
      default: null,
    },

    capturedAt: {
      type: Date,
      default: null,
    },

    // Audit trail of status changes
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
    strict: "throw",
  },
);

// A gateway payment/order should not belong to multiple records.
paymentSchema.index(
  { "gateway.razorpayOrderId": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "gateway.razorpayOrderId": { $type: "string" },
    },
  },
);

paymentSchema.index(
  { "gateway.razorpayPaymentId": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "gateway.razorpayPaymentId": { $type: "string" },
    },
  },
);

// Prevent accidental duplicate checkout records.
paymentSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });

// Useful for payment history and reconciliation.
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
