import express from "express";
import {
  register,
  login,
  logout,
  getUsers,
  getUser,
} from "../controllers/adminController.js";
import { adminProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/users", adminProtect, getUsers);
router.get("/users/:id", adminProtect, getUser);

export default router;