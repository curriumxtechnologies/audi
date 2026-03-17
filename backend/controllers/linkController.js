import asyncHandler from "express-async-handler";
import crypto from "crypto";
import Link from "../models/linkModel.js";

const generateLink = asyncHandler(async (req, res) => {
  const { agentNumber, cryptoWallet, walletAddress } = req.body;

  if (!agentNumber || !cryptoWallet || !walletAddress) {
    res.status(400);
    throw new Error("agentNumber, cryptoWallet and walletAddress are required");
  }

  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    res.status(500);
    throw new Error("FRONTEND_URL is not set");
  }

  let counter = 1;
  let linkCode = "";
  let exists = true;

  while (exists) {
    linkCode = `audi-${String(counter).padStart(2, "0")}`;
    exists = await Link.findOne({ linkCode });

    if (exists) {
      counter++;
    }
  }

  const link = await Link.create({
    linkCode,
    agentNumber,
    paymentMethod: {
      cryptoWallet,
      walletAddress,
    },
  });

  const cleanFrontendUrl = frontendUrl.replace(/\/+$/, "");
  const isProduction = process.env.NODE_ENV === "production";

  const landingLink = isProduction
    ? `${cleanFrontendUrl}/#${link.linkCode}`
    : `${cleanFrontendUrl}/index.html#${link.linkCode}`;

  res.status(201).json({
    message: "Landing link generated successfully",
    _id: link._id,
    linkCode: link.linkCode,
    landingLink,
    agentNumber: link.agentNumber,
    paymentMethod: link.paymentMethod,
  });
});

const getLink = asyncHandler(async (req, res) => {
  const { linkCode } = req.params;

  const link = await Link.findOne({ linkCode });

  if (!link) {
    res.status(404);
    throw new Error("Signup link not found");
  }

  res.status(200).json({
    _id: link._id,
    linkCode: link.linkCode,
    agentNumber: link.agentNumber,
    paymentMethod: link.paymentMethod,
  });
});

const listLinks = asyncHandler(async (req, res) => {
  const links = await Link.find({})
    .sort({ createdAt: -1 })
    .select("_id linkCode agentNumber paymentMethod createdAt");

  res.status(200).json(links);
});

export { generateLink, getLink, listLinks };