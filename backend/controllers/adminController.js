import asyncHandler from "express-async-handler";
import Admin from "../models/adminModel.js";
import User from "../models/userModel.js";
import adminGenerateToken from "../utils/adminGenerateToken.js";

// @desc    Register admin
// @route   POST /api/admin/register
// @access  Public or Private/Super Admin
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email and password");
  }

  const adminExists = await Admin.findOne({ email: email.toLowerCase() });

  if (adminExists) {
    res.status(400);
    throw new Error("Admin already exists");
  }

  const admin = await Admin.create({
    name,
    email: email.toLowerCase(),
    password,
  });

  if (!admin) {
    res.status(400);
    throw new Error("Invalid admin data");
  }

  const token = adminGenerateToken(res, admin._id);

  res.status(201).json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    token,
  });
});

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });

  if (!admin) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await admin.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = adminGenerateToken(res, admin._id);

  res.status(200).json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    token,
  });
});

// @desc    Logout admin
// @route   POST /api/admin/logout
// @access  Private/Public depending on use
const logout = asyncHandler(async (req, res) => {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("admin_jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({ message: "Logged out successfully" });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select("-password")
    .sort({ createdAt: -1 });

  res.status(200).json(users);
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user);
});


export {
  register,
  login,
  logout,
  getUsers,
  getUser,
};