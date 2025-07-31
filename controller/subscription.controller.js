import { apiResponse } from "../helper/api-response.helper.js";
import UserModel from "../models/user.model.js";
import razorpay from "../config/razorpay.config.js";
import enumConfig from "../config/enum.config.js";
import { StatusCodes } from "http-status-codes";
import config from "../config/config.js";

// Get available plans
const getPlans = async (req, res) => {
  try {
    const plans = [
      {
        name: "Starter",
        monthly: {
          price: 4.99,
          planId: enumConfig.razorpayPlanIds.STARTER_MONTHLY,
          limit: enumConfig.planLimits.starter,
          features: [
            "Up to 3 invoices/month",
            "1 default template",
            "No customization",
          ],
        },
        yearly: {
          price: 39.99,
          planId: enumConfig.razorpayPlanIds.STARTER_YEARLY,
          limit: enumConfig.planLimits.starter,
          features: [
            "Up to 3 invoices/month",
            "1 default template",
            "No customization",
          ],
        },
      },
      {
        name: "Pro",
        monthly: {
          price: 12.99,
          planId: enumConfig.razorpayPlanIds.PRO_MONTHLY,
          limit: enumConfig.planLimits.pro,
          features: [
            "Up to 10 invoices/month",
            "Customization allowed",
            "10 templates",
          ],
        },
        yearly: {
          price: 99.99,
          planId: enumConfig.razorpayPlanIds.PRO_YEARLY,
          limit: enumConfig.planLimits.pro,
          features: [
            "Up to 10 invoices/month",
            "Customization allowed",
            "10 templates",
          ],
        },
      },
      {
        name: "Unlimited",
        monthly: {
          price: 18.99,
          planId: enumConfig.razorpayPlanIds.UNLIMITED_MONTHLY,
          limit: enumConfig.planLimits.unlimited,
          features: ["Unlimited invoices", "All features", "All templates"],
        },
        yearly: {
          price: 149.99,
          planId: enumConfig.razorpayPlanIds.UNLIMITED_YEARLY,
          limit: enumConfig.planLimits.unlimited,
          features: ["Unlimited invoices", "All features", "All templates"],
        },
      },
    ];

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Plans fetched successfully",
      data: { plans },
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

// Create subscription
const createSubscription = async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;
    const userId = req.user._id; // From JWT token

    const user = await UserModel.findById(userId);
    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    // Create Razorpay customer if not exists
    if (!user.razorpayCustomerId) {
      const customer = await razorpay.customers.create({
        name: `User ${user._id}`,
        email: `user${user._id}@mintinvoice.com`,
        contact: "9999999999",
      });

      user.razorpayCustomerId = customer.id;
      await user.save();
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: billingCycle === "yearly" ? 12 : 1,
      customer_id: user.razorpayCustomerId,
      notes: {
        user_id: user._id.toString(),
        billing_cycle: billingCycle,
      },
    });

    // Update user subscription info
    user.razorpaySubscriptionId = subscription.id;
    user.isSubscribed = true;
    user.subscription.status = "pending"; // Will be 'active' after payment

    await user.save();

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Subscription created successfully",
      data: {
        subscriptionId: subscription.id,
        short_url: subscription.short_url,
        status: subscription.status,
      },
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

// Get user subscription status
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Subscription status fetched",
      data: {
        isSubscribed: user.isSubscribed,
        subscription: user.subscription,
      },
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await UserModel.findById(userId);

    if (!user || !user.razorpaySubscriptionId) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "No active subscription found",
      });
    }

    // Cancel subscription in Razorpay
    await razorpay.subscriptions.cancel(user.razorpaySubscriptionId);

    // Update user subscription
    user.subscription.status = "cancelled";
    user.isSubscribed = false;
    await user.save();

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Subscription cancelled successfully",
    });
  } catch (err) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Something went wrong",
      error: err.message,
    });
  }
};

// ----------------- Razorpay Webhook -----------------
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = config.razorpay.webhookSecret;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).send("Invalid signature");
    }

    const event = req.body.event;
    const payload = req.body.payload;

    switch (event) {
      case "subscription.activated":
        await handleSubscriptionActivated(payload);
        break;

      case "subscription.cancelled":
        await handleSubscriptionCancelled(payload);
        break;

      case "subscription.charged":
        await handleSubscriptionCharged(payload);
        break;

      case "subscription.halted":
        await handleSubscriptionHalted(payload);
        break;

      default:
        console.log(`Unhandled event: ${event}`);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook error");
  }
};

// Helper functions for webhook events
const handleSubscriptionActivated = async (payload) => {
  const subscription = payload.subscription.entity;
  const user = await UserModel.findOne({
    razorpaySubscriptionId: subscription.id,
  });

  if (user) {
    // Determine plan and billing cycle from subscription
    const planId = subscription.plan_id;
    const billingCycle = subscription.notes?.billing_cycle || "monthly";

    // Map plan ID to plan name
    let planName = "starter";
    if (planId.includes("pro")) planName = "pro";
    else if (planId.includes("unlimited")) planName = "unlimited";

    user.subscription.status = "active";
    user.subscription.plan = planName;
    user.subscription.billingCycle = billingCycle;
    user.subscription.startDate = new Date();
    user.subscription.limit = enumConfig.planLimits[planName];
    user.subscription.used = 0;
    user.isSubscribed = true;

    // Set end date
    const endDate = new Date();
    if (billingCycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    user.subscription.endDate = endDate;

    await user.save();
    console.log(`Subscription activated for user: ${user._id}`);
  }
};

const handleSubscriptionCancelled = async (payload) => {
  const subscription = payload.subscription.entity;
  const user = await UserModel.findOne({
    razorpaySubscriptionId: subscription.id,
  });

  if (user) {
    user.subscription.status = "cancelled";
    user.isSubscribed = false;
    await user.save();
    console.log(`Subscription cancelled for user: ${user._id}`);
  }
};

const handleSubscriptionCharged = async (payload) => {
  // Handle successful payment
  console.log("Payment successful:", payload.payment.entity.id);
};

const handleSubscriptionHalted = async (payload) => {
  const subscription = payload.subscription.entity;
  const user = await UserModel.findOne({
    razorpaySubscriptionId: subscription.id,
  });

  if (user) {
    user.subscription.status = "expired";
    user.isSubscribed = false;
    await user.save();
    console.log(`Subscription halted for user: ${user._id}`);
  }
};

export default {
  getPlans,
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
  handleWebhook,
};
