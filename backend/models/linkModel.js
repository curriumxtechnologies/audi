import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    coin: {
      type: String,
      required: true,
      trim: true,
    },
    network: {
      type: String,
      required: true,
      trim: true,
    },
    walletAddress: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const linkSchema = new mongoose.Schema(
  {
    linkCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    agentNumber: {
      type: String,
      required: true,
      trim: true,
    },
    paymentMethods: {
      type: [paymentMethodSchema],
      default: [],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one payment method is required",
      },
    },
  },
  { timestamps: true }
);

const Link = mongoose.model("Link", linkSchema);
export default Link;