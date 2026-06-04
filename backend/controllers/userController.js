import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";
import { sendOTPEmail, sendLoginAlertEmail } from "../utils/sendOTPEmail.js";

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();
const loginAttemptStore = new Map();

// Helper: Generate random string for reset tokens
const generateRandomToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
};

// Helper: Verify reCAPTCHA
const verifyRecaptcha = async (recaptchaToken) => {
  if (!recaptchaToken) return false;
  
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    });
    
    const data = await response.json();
    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
};

// Helper: Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: Check if login requires OTP
const requiresOTP = (user) => {
  const lastLogin = user.lastLoginAt;
  if (!lastLogin) return true;
  
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
  const timeSinceLastLogin = Date.now() - new Date(lastLogin).getTime();
  
  return timeSinceLastLogin > twoDaysInMs;
};

// Register User
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, recaptchaToken } = req.body;

  // Verify reCAPTCHA
  const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!isRecaptchaValid) {
    res.status(400);
    throw new Error("reCAPTCHA verification failed. Please try again.");
  }

  // Validate required fields
  if (!name || !email || !phone || !password) {
    res.status(400);
    throw new Error("All fields are required");
  }

  // Check if user exists
  const userExists = await User.findOne({ $or: [{ email }, { phone }] });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email or phone");
  }

  // Generate unique username
  const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  let username = baseUsername;
  let counter = 1;
  
  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter++}`;
  }

  // Create user (not verified yet)
  const user = await User.create({
    name,
    username,
    email,
    phone,
    password,
    profile: "",
    isVerified: false,
    authMethod: "email",
    agentNumber: "",
    paymentMethods: [],
  });

  // Generate and send OTP
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  otpStore.set(email, { otp, expiresAt, purpose: "registration" });
  
  await sendOTPEmail(email, otp, "registration");

  res.status(201).json({
    message: "Registration successful. Please verify your email with the OTP sent.",
    email,
  });
});

// Send OTP
const sendOTP = asyncHandler(async (req, res) => {
  const { email, purpose } = req.body;
  
  if (!email || !purpose) {
    res.status(400);
    throw new Error("Email and purpose are required");
  }

  const user = await User.findOne({ email });
  
  if (purpose === "registration" && user && user.isVerified) {
    res.status(400);
    throw new Error("User already verified");
  }
  
  if (purpose === "login" && !user) {
    res.status(404);
    throw new Error("User not found");
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  
  otpStore.set(email, { otp, expiresAt, purpose });
  
  await sendOTPEmail(email, otp, purpose);

  res.status(200).json({ message: `OTP sent to ${email}` });
});

// Verify OTP
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp, purpose } = req.body;
  
  if (!email || !otp || !purpose) {
    res.status(400);
    throw new Error("Email, OTP, and purpose are required");
  }

  const storedData = otpStore.get(email);
  
  if (!storedData) {
    res.status(400);
    throw new Error("OTP not found or expired");
  }
  
  if (storedData.purpose !== purpose) {
    res.status(400);
    throw new Error("Invalid OTP purpose");
  }
  
  if (storedData.expiresAt < Date.now()) {
    otpStore.delete(email);
    res.status(400);
    throw new Error("OTP has expired");
  }
  
  if (storedData.otp !== otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  // OTP is valid
  otpStore.delete(email);
  
  if (purpose === "registration") {
    const user = await User.findOne({ email });
    if (user) {
      user.isVerified = true;
      await user.save();
      
      const token = generateToken(res, user._id);
      
      res.status(200).json({
        message: "Email verified successfully",
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile: user.profile,
        token,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } else if (purpose === "login") {
    res.status(200).json({ 
      message: "OTP verified successfully",
      email,
      verified: true 
    });
  } else {
    res.status(200).json({ message: "OTP verified successfully" });
  }
});

// Login
const login = asyncHandler(async (req, res) => {
  const { email, password, recaptchaToken } = req.body;

  // Verify reCAPTCHA
  const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!isRecaptchaValid) {
    res.status(400);
    throw new Error("reCAPTCHA verification failed. Please try again.");
  }

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });
  
  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified) {
    res.status(401);
    throw new Error("Please verify your email first");
  }

  // Check password
  const isPasswordMatch = await user.matchPassword(password);
  if (!isPasswordMatch) {
    // Track failed login attempts
    const attempts = loginAttemptStore.get(email) || { count: 0, lastAttempt: Date.now() };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    loginAttemptStore.set(email, attempts);
    
    if (attempts.count >= 5) {
      // Send login alert email
      await sendLoginAlertEmail(email, user.name);
      loginAttemptStore.delete(email);
    }
    
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Reset failed attempts on successful password check
  loginAttemptStore.delete(email);

  // Check if OTP is required
  if (requiresOTP(user)) {
    // Generate and send OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expiresAt, purpose: "login", userId: user._id });
    await sendOTPEmail(email, otp, "login");
    
    res.status(200).json({
      requiresOTP: true,
      message: "OTP sent to your email for verification",
      email,
    });
    return;
  }

  // No OTP required, login successful
  user.lastLoginAt = new Date();
  await user.save();
  
  const token = generateToken(res, user._id);
  
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    username: user.username,
    profile: user.profile,
    authMethod: user.authMethod,
    agentNumber: user.agentNumber || "",
    paymentMethods: user.paymentMethods || [],
    token,
  });
});

// Verify Login Alert (for suspicious login attempts)
const verifyLoginAlert = asyncHandler(async (req, res) => {
  const { email, action } = req.body;
  
  if (!email || !action) {
    res.status(400);
    throw new Error("Email and action are required");
  }
  
  if (action === "change_password") {
    // Generate password reset token using Math.random()
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    
    const resetToken = generateRandomToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();
    
    res.status(200).json({
      message: "Password reset token generated",
      resetToken,
    });
  } else {
    res.status(200).json({ message: "Alert acknowledged" });
  }
});

// Forgot Password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, recaptchaToken } = req.body;
  
  // Verify reCAPTCHA
  const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
  if (!isRecaptchaValid) {
    res.status(400);
    throw new Error("reCAPTCHA verification failed. Please try again.");
  }
  
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }
  
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  
  // Generate OTP for password reset
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(email, { otp, expiresAt, purpose: "password_reset", userId: user._id });
  
  await sendOTPEmail(email, otp, "password_reset");
  
  res.status(200).json({
    message: "OTP sent to your email for password reset",
    email,
  });
});

// Reset Password (with OTP)
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error("Email, OTP, and new password are required");
  }
  
  const storedData = otpStore.get(email);
  
  if (!storedData || storedData.purpose !== "password_reset") {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }
  
  if (storedData.expiresAt < Date.now()) {
    otpStore.delete(email);
    res.status(400);
    throw new Error("OTP has expired");
  }
  
  if (storedData.otp !== otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }
  
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  
  user.password = newPassword;
  await user.save();
  
  otpStore.delete(email);
  
  res.status(200).json({ message: "Password reset successfully" });
});

// Change Password (authenticated)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  
  const isPasswordMatch = await user.matchPassword(currentPassword);
  if (!isPasswordMatch) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }
  
  user.password = newPassword;
  await user.save();
  
  res.status(200).json({ message: "Password changed successfully" });
});

// Logout
const logoutUser = asyncHandler(async (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
  
  res.status(200).json({ message: "Logged out successfully" });
});

export { 
  register, 
  login, 
  sendOTP, 
  verifyOTP, 
  forgotPassword, 
  resetPassword, 
  changePassword,
  logoutUser,
  verifyLoginAlert
};