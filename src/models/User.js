import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  credits: { type: Number, default: 0 },
  hasPurchased: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate 6-char referral code
userSchema.pre("save", function (next) {
  if (!this.referralCode) {
    this.referralCode = this._id.toString().slice(-6).toUpperCase();
  }
  next();
});

export default mongoose.model("User", userSchema);