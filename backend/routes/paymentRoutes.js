import express from "express";
import {
  makePayment,
  getPayments,
  verifyPayment,
  getMyOrders,
  sendPaymentReminder,
  failPayment,
  getPendingPaymentsForReminder,
} from "../controllers/paymentController.js";
import { protect, adminProtect } from "../middleware/authMiddleware.js";

import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer -> Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Audi_cars_Receipt",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "avif"],
  },
});

const upload = multer({ storage });

// Test connection
cloudinary.api
  .ping()
  .then(() => console.log("✅ Cloudinary connected successfully"))
  .catch((err) => console.error("❌ Cloudinary not connected:", err.message));

// Payment routes
router.post("/", protect, upload.single('receipt'), makePayment);
router.get("/my-orders", protect, getMyOrders);
router.get("/", adminProtect, getPayments);
router.put("/:id/verify", adminProtect, verifyPayment);
router.post("/:id/remind", adminProtect, sendPaymentReminder);
router.put("/:id/fail", adminProtect, failPayment);
router.get("/pending/reminders", adminProtect, getPendingPaymentsForReminder);

export default router;