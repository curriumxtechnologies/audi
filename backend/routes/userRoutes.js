import express from "express";
import { 
  register, 
  login, 
  sendOTP, 
  verifyOTP, 
  forgotPassword, 
  resetPassword, 
  changePassword,
  logoutUser,
  verifyLoginAlert
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", protect, changePassword);
router.post("/logout", logoutUser);
router.post("/verify-login-alert", verifyLoginAlert);

export default router;