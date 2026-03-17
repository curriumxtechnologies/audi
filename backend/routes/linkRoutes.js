import express from "express";
import { generateLink, getLink, listLinks } from "../controllers/linkController.js";

const router = express.Router();

router.get("/", listLinks);
router.post("/generate", generateLink);
router.get("/:linkCode", getLink);

export default router;