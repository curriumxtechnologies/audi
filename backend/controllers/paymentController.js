import asyncHandler from "express-async-handler";
import PaymentModel from "../models/paymentModel.js";

// @desc    Create payment record
// @route   POST /api/payments
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  try {
    console.log("==== MY ORDERS DEBUG START ====");
    console.log("req.user:", req.user);

    if (!req.user || !req.user._id) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }

    const payments = await PaymentModel.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    console.log("payments without populate:", payments);
    console.log("==== MY ORDERS DEBUG END ====");

    res.status(200).json(payments);
  } catch (error) {
    console.error("getMyOrders error:", error);
    res.status(500);
    throw new Error(error.message || "Failed to fetch user orders");
  }
});

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
    currency,
  } = req.body;

  const userId = req.user?._id;
  const paymentReceiptUrl = req.file?.path || req.file?.secure_url;

  if (!carId || !transactionId || !walletAddress || !paymentReceiptUrl) {
    res.status(400);
    throw new Error(
      "carId, transactionId, walletAddress and receipt are required"
    );
  }

  const existingPayment = await PaymentModel.findOne({ transactionId });

  if (existingPayment) {
    res.status(400);
    throw new Error("Payment with this transaction ID already exists");
  }

  const payment = await PaymentModel.create({
    carId,
    userId,
    fullName,
    email,
    phoneNumber,
    whatsappNumber,
    transactionId,
    paymentReceiptUrl,
    walletAddress,
    amountPaid,
    currency,
    status: "pending",
  });

  res.status(201).json(payment);
});

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private/Admin
const getPayments = asyncHandler(async (req, res) => {
  const payments = await PaymentModel.find({})
    .populate("carId")
    .populate("userId", "-password")
    .sort({ createdAt: -1 });

  res.status(200).json(payments);
});

// @desc    Verify payment
// @route   PUT /api/payments/:id/verify
// @access  Private/Admin
const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await PaymentModel.findById(req.params.id);

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  payment.status = "confirmed";

  if (req.body.fullName !== undefined) payment.fullName = req.body.fullName;
  if (req.body.email !== undefined) payment.email = req.body.email;
  if (req.body.phoneNumber !== undefined) payment.phoneNumber = req.body.phoneNumber;
  if (req.body.whatsappNumber !== undefined) payment.whatsappNumber = req.body.whatsappNumber;
  if (req.body.transactionId !== undefined) payment.transactionId = req.body.transactionId;
  if (req.body.walletAddress !== undefined) payment.walletAddress = req.body.walletAddress;
  if (req.body.amountPaid !== undefined) payment.amountPaid = req.body.amountPaid;
  if (req.body.currency !== undefined) payment.currency = req.body.currency;
  if (req.body.adminNote !== undefined) payment.adminNote = req.body.adminNote;

  const updatedPayment = await payment.save();

  res.status(200).json(updatedPayment);
});

export { makePayment, getPayments, verifyPayment, getMyOrders };