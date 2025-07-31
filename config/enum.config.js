const nodeEnvEnums = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
};

const discountTypeEnums = {
  NULL: null,
  FLAT: "flat",
  PERCENTAGE: "percentage",
};

const templateNameEnums = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
};

const currencyEnums = {
  INR: "INR",
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  AUD: "AUD",
  CAD: "CAD",
  SGD: "SGD",
  JPY: "JPY",
  CNY: "CNY",
  AED: "AED",
  ZAR: "ZAR",
  CHF: "CHF",
  HKD: "HKD",
  NZD: "NZD",
  SEK: "SEK",
  NOK: "NOK",
  DKK: "DKK",
  RUB: "RUB",
  THB: "THB",
  MYR: "MYR",
  PHP: "PHP",
  IDR: "IDR",
  KRW: "KRW",
  BRL: "BRL",
};

const subscriptionPlans = {
  STARTER: "starter",
  PRO: "pro",
  UNLIMITED: "unlimited",
};

const billingCycleEnums = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

const invoiceStatusEnums = {
  OUTSTANDING: "outstanding",
  PAID: "paid",
  NULL: null,
}

// Razorpay Plan IDs
const razorpayPlanIds = {
  STARTER_MONTHLY: "mint_starter_monthly",
  PRO_MONTHLY: "mint_pro_monthly", 
  UNLIMITED_MONTHLY: "mint_unlimited_monthly",
  
  STARTER_YEARLY: "mint_starter_yearly",
  PRO_YEARLY: "mint_pro_yearly",
  UNLIMITED_YEARLY: "mint_unlimited_yearly",
};

// NEW: Plan Limits
const planLimits = {
  starter: 3,
  pro: 10,
  unlimited: -1, 
};

const contactUsSubjectEnums = {
  TECH_SUPPORT: "Technical Support Question",
  PRICING: "Pricing/Billing Question",
  FEATURES: "Product Features Question",
  MEDIA: "Media Request",
  PARTNERSHIP: "Partnership Enquiry",
  OTHER: "Other",
};

const subscriptionStatusEnums = {
  INACTIVE: "inactive",
  ACTIVE: "active",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
};

export default {
  nodeEnvEnums,
  discountTypeEnums,
  templateNameEnums,
  currencyEnums,
  subscriptionPlans,
  billingCycleEnums,
  invoiceStatusEnums,
  contactUsSubjectEnums,
  subscriptionStatusEnums,
  razorpayPlanIds,
  planLimits,
};
