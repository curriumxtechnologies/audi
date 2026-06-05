import asyncHandler from "express-async-handler";
import PaymentModel from "../models/paymentModel.js";
import CarModel from "../models/carModel.js";
import User from "../models/userModel.js";
import { 
  sendPaymentReminderEmail, 
  sendPaymentConfirmationEmail,
  sendPaymentFailedEmail 
} from "../utils/sendPaymentEmail.js";

// Helper to clean mongoose documents
const cleanDocument = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : doc;
  // Remove any circular references or problematic fields
  delete plain.__v;
  return plain;
};

// @desc    Get user's orders
// @route   GET /api/payments/my-orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error("Not authorized, user not found");
  }

  const payments = await PaymentModel.find({ userId: req.user._id })
    .populate("carId")
    .sort({ createdAt: -1 })
    .lean(); // Use lean() to get plain JavaScript objects

  // Clean the data to ensure no circular references
  const cleanedPayments = payments.map(payment => ({
    ...payment,
    carId: payment.carId ? {
      _id: payment.carId._id,
      name: payment.carId.name,
      price: payment.carId.price,
      year: payment.carId.year,
      category: payment.carId.category,
      currency: payment.carId.currency,
      pictures: payment.carId.pictures || [],
      description: payment.carId.description,
      condition: payment.carId.condition,
      featured: payment.carId.featured,
      createdAt: payment.carId.createdAt
    } : null
  }));

  res.status(200).json(cleanedPayments);
});

// @desc    Create payment record
// @route   POST /api/payments
// @access  Private
const makePayment = asyncHandler(async (req, res) => {
  const {
    carId,
    fullName,
    email,
    phoneNumber,
    whatsappNumber,
    transactionId,
    walletAddress,
    amountPaid,
    paymentMethod,
    paymentNetwork,
    optionalNote,
    paymentType,
  } = req.body;

  const userId = req.user?._id;
  const paymentReceiptUrl = req.file?.path || req.file?.secure_url;

  if (!carId || !transactionId || !walletAddress || !paymentReceiptUrl) {
    res.status(400);
    throw new Error("carId, transactionId, walletAddress and receipt are required");
  }

  const car = await CarModel.findById(carId);
  if (!car) {
    res.status(404);
    throw new Error("Car not found");
  }

  const user = await User.findById(userId);
  const userEmail = email || user?.email;
  const userName = fullName || user?.name;

  const existingPayment = await PaymentModel.findOne({ transactionId });
  if (existingPayment) {
    res.status(400);
    throw new Error("Payment with this transaction ID already exists");
  }

  const carPrice = car.price || 0;
  const amountPaidNum = parseFloat(amountPaid) || 0;
  const paymentPercentage = carPrice > 0 ? (amountPaidNum / carPrice) * 100 : 0;
  const isFullPayment = paymentPercentage >= 99.5 || paymentType === "full";
  const remainingBalance = isFullPayment ? 0 : carPrice - amountPaidNum;

  if (amountPaidNum > carPrice) {
    res.status(400);
    throw new Error("Amount paid cannot exceed car price");
  }

  const payment = await PaymentModel.create({
    carId,
    userId,
    fullName: userName,
    email: userEmail,
    phoneNumber,
    whatsappNumber,
    transactionId,
    paymentReceiptUrl,
    walletAddress,
    amountPaid: amountPaidNum,
    currency: "USD",
    status: "pending_approval",
    paymentPercentage,
    isFullPayment,
    remainingBalance,
    paymentType: isFullPayment ? "full" : "part",
    paymentMethod: paymentMethod || "USDT",
    paymentNetwork: paymentNetwork || "TRC20",
    optionalNote: optionalNote || "",
    carPriceAtPurchase: carPrice,
  });

  // Send email in background
  if (userEmail) {
    sendPaymentConfirmationEmail(
      userEmail,
      userName,
      car,
      amountPaidNum,
      "USD",
      paymentPercentage,
      isFullPayment,
      remainingBalance,
      transactionId,
      paymentMethod || "USDT",
      paymentNetwork || "TRC20"
    ).catch(err => console.error("Email error:", err));
  }

  res.status(201).json(payment);
});

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private/Admin
const getPayments = asyncHandler(async (req, res) => {
  const payments = await PaymentModel.find({})
    .populate("carId")
    .populate("userId", "-password")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(payments);
});

// @desc    Verify payment (Admin)
// @route   PUT /api/payments/:id/verify
// @access  Private/Admin
const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await PaymentModel.findById(req.params.id)
    .populate("carId")
    .populate("userId", "-password");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  const oldStatus = payment.status;
  payment.status = "confirmed";
  payment.paymentConfirmedAt = new Date();

  if (req.body.fullName !== undefined) payment.fullName = req.body.fullName;
  if (req.body.email !== undefined) payment.email = req.body.email;
  if (req.body.phoneNumber !== undefined) payment.phoneNumber = req.body.phoneNumber;
  if (req.body.whatsappNumber !== undefined) payment.whatsappNumber = req.body.whatsappNumber;
  if (req.body.transactionId !== undefined) payment.transactionId = req.body.transactionId;
  if (req.body.walletAddress !== undefined) payment.walletAddress = req.body.walletAddress;
  if (req.body.amountPaid !== undefined) payment.amountPaid = req.body.amountPaid;
  if (req.body.adminNote !== undefined) payment.adminNote = req.body.adminNote;
  if (req.body.paymentMethod !== undefined) payment.paymentMethod = req.body.paymentMethod;
  if (req.body.paymentNetwork !== undefined) payment.paymentNetwork = req.body.paymentNetwork;

  const updatedPayment = await payment.save();

  if (oldStatus !== "confirmed" && payment.email) {
    const car = payment.carId;
    const amountPaidNum = payment.amountPaid || 0;
    const carPrice = car?.price || 0;
    const paymentPercentage = carPrice > 0 ? (amountPaidNum / carPrice) * 100 : 0;
    const isFullPayment = paymentPercentage >= 99.5;
    const remainingBalance = carPrice - amountPaidNum;

    sendPaymentConfirmationEmail(
      payment.email,
      payment.fullName || "Valued Customer",
      car,
      amountPaidNum,
      "USD",
      paymentPercentage,
      isFullPayment,
      remainingBalance,
      payment.transactionId,
      payment.paymentMethod || "USDT",
      payment.paymentNetwork || "TRC20"
    ).catch(err => console.error("Email error:", err));
  }

  res.status(200).json(updatedPayment);
});

// @desc    Send payment reminder
// @route   POST /api/payments/:id/remind
// @access  Private/Admin
const sendPaymentReminder = asyncHandler(async (req, res) => {
  const payment = await PaymentModel.findById(req.params.id)
    .populate("carId")
    .populate("userId", "-password");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  if (payment.status === "confirmed") {
    res.status(400);
    throw new Error("Payment is already confirmed. No reminder needed.");
  }

  const car = payment.carId;
  const amountPaidNum = payment.amountPaid || 0;
  const carPrice = car?.price || 0;
  const remainingBalance = carPrice - amountPaidNum;

  await sendPaymentReminderEmail(
    payment.email,
    payment.fullName || "Valued Customer",
    car,
    amountPaidNum,
    remainingBalance,
    "USD",
    payment.transactionId,
    payment._id,
    payment.paymentMethod || "USDT"
  );

  payment.lastReminderSent = new Date();
  payment.reminderCount = (payment.reminderCount || 0) + 1;
  await payment.save();

  res.status(200).json({ 
    success: true, 
    message: "Payment reminder sent successfully" 
  });
});

// @desc    Mark payment as failed
// @route   PUT /api/payments/:id/fail
// @access  Private/Admin
const failPayment = asyncHandler(async (req, res) => {
  const payment = await PaymentModel.findById(req.params.id)
    .populate("carId")
    .populate("userId", "-password");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  if (payment.status === "confirmed") {
    res.status(400);
    throw new Error("Cannot fail a confirmed payment");
  }

  payment.status = "failed";
  payment.failureReason = req.body.reason || "Payment verification failed";
  await payment.save();

  if (payment.email) {
    sendPaymentFailedEmail(
      payment.email,
      payment.fullName || "Valued Customer",
      payment.carId,
      payment.amountPaid,
      "USD",
      payment.transactionId,
      payment.failureReason,
      payment.paymentMethod || "USDT"
    ).catch(err => console.error("Email error:", err));
  }

  res.status(200).json({ 
    success: true, 
    message: "Payment marked as failed" 
  });
});

// @desc    Get pending payments for reminders
// @route   GET /api/payments/pending/reminders
// @access  Private/Admin
const getPendingPaymentsForReminder = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const pendingPayments = await PaymentModel.find({
    status: "pending_approval",
    createdAt: { $lt: sevenDaysAgo },
    $or: [
      { lastReminderSent: { $exists: false } },
      { lastReminderSent: { $lt: sevenDaysAgo } }
    ],
    reminderCount: { $lt: 5 }
  }).populate("carId").lean();

  res.status(200).json(pendingPayments);
});

export { 
  makePayment, 
  getPayments, 
  verifyPayment, 
  getMyOrders,
  sendPaymentReminder,
  failPayment,
  getPendingPaymentsForReminder
};