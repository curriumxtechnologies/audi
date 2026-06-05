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

// Check if email exists
const checkEmailExists = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address");
  }
  
  const user = await User.findOne({ email });
  
  if (!user) {
    res.status(404);
    throw new Error("No account found with this email");
  }
  
  res.status(200).json({
    success: true,
    message: "Email exists",
    email: user.email
  });
});

// Register User
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !password) {
    res.status(400);
    throw new Error("All fields are required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address");
  }

  // Validate phone format (basic)
  if (phone.length < 10) {
    res.status(400);
    throw new Error("Please enter a valid phone number");
  }

  // Validate password strength
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
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
    success: true,
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

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address");
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

  if (purpose === "password_reset" && !user) {
    res.status(404);
    throw new Error("No account found with this email");
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  
  otpStore.set(email, { otp, expiresAt, purpose });
  
  await sendOTPEmail(email, otp, purpose);

  res.status(200).json({ 
    success: true,
    message: `OTP sent to ${email}` 
  });
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
        success: true,
        message: "Email verified successfully",
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        username: user.username,
        profile: user.profile,
        token,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } else if (purpose === "login") {
    // Complete login after OTP verification
    const user = await User.findOne({ email });
    if (user) {
      user.lastLoginAt = new Date();
      await user.save();
      
      const token = generateToken(res, user._id);
      
      res.status(200).json({ 
        success: true,
        message: "OTP verified successfully",
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
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } else if (purpose === "password_reset") {
    // OTP verified successfully for password reset
    res.status(200).json({ 
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
      email,
      verified: true 
    });
  } else {
    res.status(200).json({ 
      success: true,
      message: "OTP verified successfully" 
    });
  }
});

// Login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

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
    throw new Error("Please verify your email first. Check your inbox for the OTP.");
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
      success: true,
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
    success: true,
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

// Forgot Password - First step: Check email and send OTP
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address");
  }
  
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("No account found with this email");
  }
  
  // Generate OTP for password reset
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(email, { otp, expiresAt, purpose: "password_reset", userId: user._id });
  
  await sendOTPEmail(email, otp, "password_reset");
  
  res.status(200).json({
    success: true,
    message: "OTP sent to your email for password reset",
    email,
  });
});

// Reset Password - Final step after OTP verification
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  
  if (!email || !newPassword) {
    res.status(400);
    throw new Error("Email and new password are required");
  }
  
  // Validate password strength
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }
  
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  
  user.password = newPassword;
  await user.save();
  
  res.status(200).json({ 
    success: true,
    message: "Password reset successfully" 
  });
});

// Change Password (authenticated)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  
  // Validate new password strength
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }
  
  const isPasswordMatch = await user.matchPassword(currentPassword);
  if (!isPasswordMatch) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }
  
  user.password = newPassword;
  await user.save();
  
  res.status(200).json({ 
    success: true,
    message: "Password changed successfully" 
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
      success: true,
      message: "Password reset token generated",
      resetToken,
    });
  } else {
    res.status(200).json({ 
      success: true,
      message: "Alert acknowledged" 
    });
  }
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
  
  res.status(200).json({ 
    success: true,
    message: "Logged out successfully" 
  });
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
  verifyLoginAlert,
  checkEmailExists
};