import User from "../models/User.js";
import Referral from "../models/Referral.js";
import mongoose from "mongoose";

export const getDashboard = async (req, res) => {
  const user = await User.findById(req.user.id);
  const referrals = await Referral.find({ referrer: req.user.id });
  const converted = await Referral.find({ referrer: req.user.id, status: "converted" });

  const referredUsers = referrals.length;
  const convertedUsers = converted.length;
  const totalCredits = user.credits;

  const BASE_URL = process.env.CLIENT_URL || 'http://localhost:3000';
  const referralLink = `${BASE_URL}/register?ref=${user.referralCode}`;

res.json({
  referredUsers,
  convertedUsers,
  totalCredits,
  referralLink,
  hasPurchased: user.hasPurchased, // ← ADD THIS
});
};

export const makePurchase = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: "User not found" });
      }

      if (user.hasPurchased) {
        await session.abortTransaction();
        return res.status(400).json({ message: "You have already made a purchase" });
      }

      user.hasPurchased = true;
      user.credits += 2;
      await user.save({ session });

      const referral = await Referral.findOne({ referred: userId }).session(session);
      if (referral && referral.status === "pending") {
        referral.status = "converted";
        await referral.save({ session });

        await User.findByIdAndUpdate(
          referral.referrer,
          { $inc: { credits: 2 } },
          { session }
        );
      }

      await session.commitTransaction();
      res.json({
        message: "Purchase successful! You earned 2 credits.",
        credits: user.credits,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Purchase error:", error);
    res.status(500).json({ message: "Purchase failed. Try again." });
  }
};