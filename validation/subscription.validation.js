import Joi from "joi";
import enumConfig from "../config/enum.config.js";

const createSubscription = Joi.object({
  planId: Joi.string()
    .valid(...Object.values(enumConfig.razorpayPlanIds))
    .required()
    .label("Plan ID")
    .messages({
      "string.base": "Plan ID must be a string",
      "any.required": "Plan ID is required",
      "any.only": "Invalid plan ID",
    }),
  
  billingCycle: Joi.string()
    .valid(...Object.values(enumConfig.billingCycleEnums))
    .required()
    .label("Billing Cycle")
    .messages({
      "string.base": "Billing cycle must be a string",
      "any.required": "Billing cycle is required",
      "any.only": "Invalid billing cycle",
    }),
});

export default { createSubscription };