import express from "express";
import { protect } from "../middlewares/auth.js";
import { getDashboard, makePurchase } from "../controllers/userController.js";

const router = express.Router();

router.get("/dashboard", protect, getDashboard);
router.post("/purchase", protect, makePurchase);

export default router;