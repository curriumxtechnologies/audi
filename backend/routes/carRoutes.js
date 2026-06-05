import express from "express";
import {
  addCars,
  editCarDetails,
  getCars,
  getCarById,
  getCarByIdNoEmail,
  shareCarViaEmail,
  deleteCar,
} from "../controllers/carController.js";
import { adminProtect, protect } from "../middleware/authMiddleware.js";

import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from 'multer-storage-cloudinary'

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
    folder: "Audi_cars",
    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "avif",
      "heic",
      "heif",
      "gif",
      "bmp",
      "tif",
      "tiff",
      "svg",
      "ico",
      "apng",
      "jfif",
      "dng",
      "cr2",
      "cr3",
      "nef",
      "arw",
      "raf",
      "orf",
    ],
    // public_id: (req, file) => `car_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  },
});

const upload = multer({ storage });

// Optional: test connection (DON'T block server startup if it fails)
cloudinary.api
  .ping()
  .then(() => console.log("✅ Cloudinary connected successfully"))
  .catch((err) => console.error("❌ Cloudinary not connected:", err.message));

// Car routes
router.post("/", adminProtect, upload.array("pictures", 10), addCars);
router.get("/", getCars);
router.get("/:id/view", getCarByIdNoEmail); // Public view - no email sent
router.post("/:id/share", shareCarViaEmail); // Share car via email to any address
router.get("/:id", protect, getCarById); // Authenticated view - sends email
router.put("/:id", adminProtect, upload.array("pictures", 10), editCarDetails);
router.delete("/:id", adminProtect, deleteCar);

export default router;