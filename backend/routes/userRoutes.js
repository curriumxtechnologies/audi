import express from "express";
<<<<<<< HEAD
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
=======
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
>>>>>>> 5578cc7efbe8363c7c92b44d68ed2f106f8cb082
router.post("/logout", logoutUser);
router.post("/verify-login-alert", verifyLoginAlert);

export default router;