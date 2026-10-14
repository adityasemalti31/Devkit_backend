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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.type !== "contribution";
      },
      index: true,
    },

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

    purpose: {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },

      itemCode: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      resourceId: {
        type: Schema.Types.ObjectId,
        default: null,
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: () => ({}),
      },
    },

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

    gateway: {
      provider: {
        type: String,
        enum: ["razorpay", "cashfree"],
        default: "cashfree",
        required: true,
      },

      cashfreeOrderId: {
        type: String,
        default: null,
      },

      cashfreePaymentId: {
        type: String,
        default: null,
      },

      cashfreePaymentSessionId: {
        type: String,
        default: null,
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

    refunds: {
      type: [refundSchema],
      default: [],
    },

    idempotencyKey: {
      type: String,
      required: true,
      immutable: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    capturedAt: {
      type: Date,
      default: null,
    },

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

paymentSchema.index(
  { "gateway.cashfreeOrderId": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "gateway.cashfreeOrderId": { $type: "string" },
    },
  },
);

paymentSchema.index(
  { "gateway.cashfreePaymentId": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "gateway.cashfreePaymentId": { $type: "string" },
    },
  },
);

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

paymentSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
