import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false, // Made optional since it might not be present for all users
    },
    googleId: {
      type: String,
      sparse: true, // Allows multiple null values but ensures uniqueness for non-null values
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    profile: {
      type: String,
      default: "", // Default empty string for profile picture URL
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    authMethod: {
      type: String,
      enum: ["local", "google"], // Restrict to these values
      default: "local",
    },
    agentNumber: {
      type: String,
      default: "",
    },
    paymentMethod: {
      cryptoWallet: {
        type: String,
        default: "",
      },
      walletAddress: {
        type: String,
        default: "",
      },
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// ✅ Hash password only if modified and not a Google auth placeholder
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  // Don't hash Google auth placeholder passwords
  if (this.password.startsWith("google-auth-")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
