import express from "express";
import validate from "../middleware/validate.js";
import { verifyToken } from "../middleware/verify-token.middleware.js";
import subscriptionController from "../controller/subscription.controller.js";
import subscriptionValidation from "../validation/subscription.validation.js";

const route = express.Router();

// Get available plans (public)
route.get("/plans", subscriptionController.getPlans);

// Subscription routes (protected)
route.post(
  "/create",
  verifyToken,
  validate(subscriptionValidation.createSubscription),
  subscriptionController.createSubscription
);

route.get(
  "/status",
  verifyToken,
  subscriptionController.getSubscriptionStatus
);

route.post(
  "/cancel",
  verifyToken,
  subscriptionController.cancelSubscription
);

// Razorpay Webhook
route.post("/webhook", subscriptionController.handleWebhook);

export default route;