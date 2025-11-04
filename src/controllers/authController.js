import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Referral from "../models/Referral.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

export const register = async (req, res) => {
  const { email, password, refCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "User already exists" });

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const user = await User.create({ email, password: hashed });

  // Handle referral
  if (refCode) {
    const referrer = await User.findOne({ referralCode: refCode });
    if (referrer && referrer._id.toString() !== user._id.toString()) {
      await Referral.create({ referrer: referrer._id, referred: user._id });
    }
  }

  res.status(201).json({
    _id: user._id,
    email: user.email,
    referralCode: user.referralCode,
    token: generateToken(user._id),
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({
    _id: user._id,
    email: user.email,
    referralCode: user.referralCode,
    token: generateToken(user._id),
  });
};