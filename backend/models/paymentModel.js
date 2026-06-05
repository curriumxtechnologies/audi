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
      unique: true,
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
      enum: ["pending", "pending_approval", "confirmed", "failed"],
      default: "pending",
    },

    // New fields for payment tracking
    paymentPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      comment: "Percentage of total car price paid",
    },

    isFullPayment: {
      type: Boolean,
      default: false,
      comment: "Whether this is a full payment or part payment",
    },

    remainingBalance: {
      type: Number,
      min: 0,
      default: 0,
      comment: "Remaining balance to be paid (only for part payments)",
    },

    paymentType: {
      type: String,
      enum: ["part", "full"],
      default: "part",
      comment: "Type of payment made",
    },

    paymentMethod: {
      type: String,
      trim: true,
      default: "",
      comment: "Crypto payment method used (e.g., USDT, BTC, ETH)",
    },

    paymentNetwork: {
      type: String,
      trim: true,
      default: "",
      comment: "Blockchain network used (e.g., TRC20, ERC20, BEP20)",
    },

    optionalNote: {
      type: String,
      trim: true,
      default: "",
      comment: "Optional note from buyer to admin",
    },

    adminNote: {
      type: String,
      trim: true,
      default: "",
    },

    failureReason: {
      type: String,
      trim: true,
      default: "",
      comment: "Reason for payment failure (if status is 'failed')",
    },

    lastReminderSent: {
      type: Date,
      default: null,
      comment: "Last time a payment reminder was sent",
    },

    reminderCount: {
      type: Number,
      default: 0,
      min: 0,
      comment: "Number of reminders sent for this payment",
    },

    paymentConfirmedAt: {
      type: Date,
      default: null,
      comment: "When the payment was confirmed by admin",
    },

    carPriceAtPurchase: {
      type: Number,
      min: 0,
      default: 0,
      comment: "Snapshot of car price at time of purchase",
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for formatted amount
paymentModelSchema.virtual('formattedAmount').get(function() {
  if (!this.amountPaid) return '0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(this.amountPaid);
});

// Virtual for formatted remaining balance
paymentModelSchema.virtual('formattedRemainingBalance').get(function() {
  if (!this.remainingBalance) return '0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(this.remainingBalance);
});

// Virtual for payment progress
paymentModelSchema.virtual('paymentProgress').get(function() {
  return `${this.paymentPercentage.toFixed(1)}%`;
});

// Indexes for better query performance
paymentModelSchema.index({ userId: 1, createdAt: -1 });
paymentModelSchema.index({ status: 1, createdAt: -1 });
paymentModelSchema.index({ transactionId: 1 }, { unique: true });
paymentModelSchema.index({ email: 1 });
paymentModelSchema.index({ lastReminderSent: 1 });
paymentModelSchema.index({ status: 1, createdAt: 1 });
paymentModelSchema.index({ isFullPayment: 1 });

// Method to check if reminder can be sent
paymentModelSchema.methods.canSendReminder = function() {
  if (this.status !== 'pending_approval') return false;
  if (this.reminderCount >= 5) return false;
  
  if (this.lastReminderSent) {
    const daysSinceLastReminder = (Date.now() - this.lastReminderSent) / (1000 * 60 * 60 * 24);
    if (daysSinceLastReminder < 7) return false;
  }
  
  return true;
};

// Method to mark reminder as sent
paymentModelSchema.methods.markReminderSent = async function() {
  this.lastReminderSent = new Date();
  this.reminderCount += 1;
  return await this.save();
};

// Method to confirm payment
paymentModelSchema.methods.confirmPayment = async function(adminNote = "") {
  this.status = "confirmed";
  this.paymentConfirmedAt = new Date();
  if (adminNote) this.adminNote = adminNote;
  return await this.save();
};

// Method to fail payment
paymentModelSchema.methods.failPayment = async function(reason = "") {
  this.status = "failed";
  this.failureReason = reason;
  return await this.save();
};

// Static method to get pending payments older than X days
paymentModelSchema.statics.getPendingPaymentsOlderThan = async function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return await this.find({
    status: "pending_approval",
    createdAt: { $lt: cutoffDate },
    $or: [
      { lastReminderSent: { $exists: false } },
      { lastReminderSent: { $lt: cutoffDate } }
    ],
    reminderCount: { $lt: 5 }
  }).populate("carId");
};

// Static method to get user's payment summary
paymentModelSchema.statics.getUserPaymentSummary = async function(userId) {
  const payments = await this.find({ userId })
    .populate("carId")
    .sort({ createdAt: -1 });
  
  const totalPaid = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const confirmedPayments = payments.filter(p => p.status === "confirmed");
  const pendingPayments = payments.filter(p => p.status === "pending_approval");
  const failedPayments = payments.filter(p => p.status === "failed");
  
  return {
    totalPayments: payments.length,
    totalAmountPaid: totalPaid,
    confirmedCount: confirmedPayments.length,
    pendingCount: pendingPayments.length,
    failedCount: failedPayments.length,
    payments
  };
};

const PaymentModel = mongoose.model("PaymentModel", paymentModelSchema);

export default PaymentModel;