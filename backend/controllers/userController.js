import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";
import { OAuth2Client } from "google-auth-library";
import Link from "../models/linkModel.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getUserInfoFromAccessToken = async (accessToken) => {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user info from Google");
  }

  return response.json();
};

const googleAuth = asyncHandler(async (req, res) => {
  const { token: googleToken, phone, mode, linkCode } = req.body;

  if (!googleToken) {
    res.status(400);
    throw new Error("Google token is required");
  }

  if (!mode || !["signup", "login"].includes(mode)) {
    res.status(400);
    throw new Error("Valid mode is required");
  }

  let googleId = "";
  let email = "";
  let name = "";
  let picture = "";

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    googleId = payload?.sub || "";
    email = payload?.email || "";
    name = payload?.name || "";
    picture = payload?.picture || "";
  } catch (error) {
    const userInfo = await getUserInfoFromAccessToken(googleToken);

    googleId = userInfo?.sub || `google-${userInfo?.email || Date.now()}`;
    email = userInfo?.email || "";
    name = userInfo?.name || "";
    picture = userInfo?.picture || "";
  }

  if (!email) {
    res.status(400);
    throw new Error("Google account email is required");
  }

  let user = await User.findOne({
    $or: [{ googleId }, { email }],
  });

  if (mode === "signup") {
    const cleanedPhone = String(phone || "").trim();
    const cleanedLinkCode = String(linkCode || "").trim();

    if (!cleanedPhone) {
      res.status(400);
      throw new Error("Phone number is required");
    }

    if (user) {
      res.status(400);
      throw new Error("Account already exists. Please login instead.");
    }

    let signupLink = null;

    if (cleanedLinkCode) {
      signupLink = await Link.findOne({ linkCode: cleanedLinkCode });

      if (!signupLink) {
        res.status(404);
        throw new Error("Invalid signup link");
      }
    }

    const baseUsername = (email?.split("@")[0] || name || "user")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_]/g, "") || "user";

    let username = baseUsername;
    let counter = 1;

    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter++}`;
    }

    const normalizedPaymentMethods = Array.isArray(signupLink?.paymentMethods)
      ? signupLink.paymentMethods
          .map((method) => ({
            coin: String(method?.coin || "").trim(),
            network: String(method?.network || "").trim(),
            walletAddress: String(method?.walletAddress || "").trim(),
          }))
          .filter(
            (method) =>
              method.coin && method.network && method.walletAddress,
          )
      : [];

    user = await User.create({
      googleId,
      name: name || "",
      username,
      email,
      phone: cleanedPhone,
      profile: picture || "",
      password: `google-auth-${googleId}`,
      isVerified: true,
      authMethod: "google",
      agentNumber: String(signupLink?.agentNumber || "").trim(),
      paymentMethods: normalizedPaymentMethods,
    });
  }

  if (mode === "login") {
    if (!user) {
      res.status(404);
      throw new Error("No account found with this email. Please sign up first.");
    }

    if (!user.phone) {
      res.status(400);
      throw new Error("This account has no phone number. Please complete signup.");
    }

    if (!user.googleId) {
      user.googleId = googleId;
    }

    if (!user.profile && picture) {
      user.profile = picture;
    }

    if (!user.name && name) {
      user.name = name;
    }

    user.isVerified = true;
    user.authMethod = "google";
    await user.save();
  }

  const token = generateToken(res, user._id);

  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
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

export { googleAuth, logoutUser };
