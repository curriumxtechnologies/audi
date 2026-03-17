import mongoose from "mongoose";

const linkSchema = mongoose.Schema(
  {
    linkCode: {
      type: String,
      required: true,
      unique: true,
    },
    agentNumber: {
      type: String,
      required: true,
    },
    paymentMethod: {
      cryptoWallet: {
        type: String,
        required: true,
      },
      walletAddress: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const Link = mongoose.model("Link", linkSchema);
export default Link;