const mongoose = require("mongoose");

const contactQuerySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },

    queryType: {
      type: String,
      required: [true, "Query type is required"],
      enum: [
        "General Inquiry",
        "Technical Support",
        "Billing",
        "Bug Report",
        "Feature Request",
        "Partnership",
        "Other",
      ],
    },

    query: {
      type: String,
      required: [true, "Query is required"],
      trim: true,
      minlength: 5,
      maxlength: 3000,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ContactQuery", contactQuerySchema);