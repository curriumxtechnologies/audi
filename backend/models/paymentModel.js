import mongoose from "mongoose";

const paymentModelSchema = new mongoose.Schema(
  {
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarModel",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fullName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },

    whatsappNumber: {
      type: String,
      trim: true,
      default: "",
    },

    transactionId: {
      type: String,
      required: true,
      trim: true,
    },

    paymentReceiptUrl: {
      type: String,
      required: true,
      trim: true,
    },

    walletAddress: {
      type: String,
      required: true,
      trim: true,
    },

    amountPaid: {
      type: Number,
      min: 0,
      default: 0,
    },

    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: "USD",
    },

    status: {
      type: String,
      enum: ["pending", "confirmed"],
      default: "pending",
    },

    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const PaymentModel = mongoose.model("PaymentModel", paymentModelSchema);

export default PaymentModel;