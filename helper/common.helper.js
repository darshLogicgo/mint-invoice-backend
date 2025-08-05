import config from "../config/config.js";
import jwt from "jsonwebtoken";
import moment from "moment";
import UserModel from "../models/user.model.js";
import enumConfig from "../config/enum.config.js";
import InvoiceModel from "../models/invoice.model.js";

// ----------- Pagination -----------
const paginationDetails = ({ page = 1, totalItems, limit }) => {
  const totalPages = Math.ceil(totalItems / limit);
  return { page: Number(page), totalPages, totalItems, limit };
};

const paginationFun = (data) => {
  const { page = 1, limit = 10 } = data;
  return {
    limit: Number(limit),
    skip: (Number(page) - 1) * Number(limit),
  };
};

// ------------- Token -------------
const generateToken = async (payload, expiresIn = "30d") => {
  return jwt.sign(payload, config.jwt.secretKey, {
    expiresIn: expiresIn,
  });
};

const verifyToken = async (token) => {
  return jwt.verify(token, config.jwt.secretKey);
};

// ------------- Generate OTP -------------
const generateOTP = () => {
  // Generate a random number between 1000 and 9999
  const otp = Math.floor(1000 + Math.random() * 9000);
  const otpExpiryDurationSeconds = 180;
  const otpExpiresAt = moment()
    .add(otpExpiryDurationSeconds, "seconds")
    .toDate();
  return { otp, otpExpiresAt };
};

const generateOTPArray = (length, count) => {
  const otpArray = [];

  for (let i = 0; i < count; i++) {
    const otp = Math.floor(Math.random() * Math.pow(10, length));
    otpArray.push(otp);
  }

  return otpArray;
};

// ------------- Formatting -------------
const formatDateToString = (date) => {
  return `${date.getFullYear()}${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}${date
    .getHours()
    .toString()
    .padStart(2, "0")}${date.getMinutes().toString().padStart(2, "0")}${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
};

const convertUtcToLocal = (utcTimestamp) => {
  const utcTime = moment.utc(utcTimestamp);
  if (!utcTime.isValid()) {
    throw new Error("Invalid UTC timestamp format.");
  }
  const localTime = utcTime.local();
  return localTime.format("DD-MM-YYYY HH:mm:ss");
};

const validateEntitiesExistence = async (entities) => {
  const results = await Promise.all(
    entities.map(async ({ model, id, name }) => {
      const entity = await model.findById(id);
      return entity ? null : `${name} with ID ${id} not found`;
    })
  );
  return results.filter((result) => result !== null);
};

const toBoolean = (value) => {
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return value;
};

const extractFileKey = (url) => {
  const parts = url.split("/");
  const fileKey = parts.slice(3).join("/");
  return fileKey;
};

const ensureUserId = async (userId, email) => {
  if (userId) return userId;
  try {
    const user = await UserModel.findOne({ email });
    return user ? user._id.toString() : "Not Found";
  } catch (err) {
    console.error("Error fetching user by email:", err.message);
    return "ErrorFetching";
  }
};

const canCreateInvoice = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) return { allowed: false, message: "User not found" };

  // Unlimited Plan
  if (user?.subscription.plan === "unlimited") return { allowed: true };

  const invoiceCount = await InvoiceModel.countDocuments({ createdBy: userId });
  console.log(invoiceCount)

  if (!user.isSubscribed || !user?.subscription.plan) {
    return invoiceCount < 3
      ? { allowed: true }
      : {
          allowed: false,
          message: "Free invoice limit (3) reached. Please subscribe.",
        };
  }

  if (
    user.isSubscribed &&
    user?.subscription.plan === "starter" &&
    invoiceCount >= 3
  ) {
    return {
      allowed: false,
      message: "Starter Plan allows up to 3 invoices/month.",
    };
  }

  if (
    user.isSubscribed &&
    user?.subscription.plan === "pro" &&
    invoiceCount >= 10
  ) {
    return {
      allowed: false,
      message: "Pro Plan allows up to 10 invoices/month.",
    };
  }

  return { allowed: true };
};

export default {
  generateOTP,
  verifyToken,
  generateToken,
  paginationDetails,
  paginationFun,
  extractFileKey,
  formatDateToString,
  convertUtcToLocal,
  validateEntitiesExistence,
  toBoolean,
  generateOTPArray,
  ensureUserId,
  canCreateInvoice,
};
