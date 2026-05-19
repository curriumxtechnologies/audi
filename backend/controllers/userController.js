import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";

const generateUniqueUsername = async (name, email) => {
  const baseUsername =
    (name || email.split("@")[0] || "user")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_]/g, "") || "user";

  let username = baseUsername;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter++}`;
  }

  return username;
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body;

  if (!name || !email || !phone || !password || !confirmPassword) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const cleanedEmail = String(email).trim().toLowerCase();
  const cleanedName = String(name).trim();
  const cleanedPhone = String(phone).trim();

  const userExists = await User.findOne({ email: cleanedEmail });

  if (userExists) {
    res.status(400);
    throw new Error("Account already exists. Please login instead.");
  }

  const username = await generateUniqueUsername(cleanedName, cleanedEmail);

  const user = await User.create({
    name: cleanedName,
    email: cleanedEmail,
    phone: cleanedPhone,
    username,
    password,
    isVerified: true,
    authMethod: "local",
  });

  const token = generateToken(res, user._id);

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    username: user.username,
    profile: user.profile,
    authMethod: user.authMethod,
    agentNumber: user.agentNumber || "",
    paymentMethods: Array.isArray(user.paymentMethods)
      ? user.paymentMethods
      : [],
    token,
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const cleanedEmail = String(email).trim().toLowerCase();

  const user = await User.findOne({ email: cleanedEmail });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

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
    paymentMethods: Array.isArray(user.paymentMethods)
      ? user.paymentMethods
      : [],
    token,
  });
});

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

export { registerUser, loginUser, logoutUser };