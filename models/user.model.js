import mongoose from "mongoose";
import enumConfig from "../config/enum.config.js";

const userSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    default: null,
  },
  isSubscribed: { type: Boolean, default: false },

  // Razorpay fields
  razorpayCustomerId: { type: String, default: null },
  razorpaySubscriptionId: { type: String, default: null },

  subscription: {
    plan: {
      type: String,
      enum: Object.values(enumConfig.subscriptionPlans),
      default: null,
    },
    billingCycle: {
      type: String,
      enum: Object.values(enumConfig.billingCycleEnums),
      default: null,
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },





    
    limit: {
      type: Number,
      default: 1, // default limit for starter or free plan
    },
    used: {
      type: Number,
      default: 0, // how many invoices the user has created
    },
    resetAt: {
      type: Date,
      default: null, // monthly reset time
    },

    status: {
      type: String,
      enum: Object.values(enumConfig.subscriptionStatusEnums),
      default: enumConfig.subscriptionStatusEnums.INACTIVE,
    },
  },
});

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
