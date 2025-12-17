import express from "express";
import { getActivityFeed } from "../controllers/activity.controller.js";
import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router();

router.get("/feed", authMiddleware, getActivityFeed);

export default router;
