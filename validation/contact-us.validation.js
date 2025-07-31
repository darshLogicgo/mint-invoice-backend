import Joi from "joi";

const contactUsForm = Joi.object({
  firstName: Joi.string().label("First Name").required().messages({
    "string.base": "First Name must be a string",
    "string.empty": "First Name cannot be empty",
    "any.required": "First Name is required",
  }),

  lastName: Joi.string().label("Last Name").messages({
    "string.base": "Last Name must be a string",
    "string.empty": "Last Name cannot be empty",
    "any.required": "Last Name is required",
  }),

  email: Joi.string().required().label("Email").messages({
    "string.base": "Email must be a string",
    "string.empty": "Email cannot be empty",
    "any.required": "Email is required",
    "string.email": "Email must be a valid email address",
  }),

  subject: Joi.string()
    .valid(
      "Technical Support Question",
      "Pricing/Billing Question",
      "Product Features Question",
      "Media Request",
      "Partnership Enquiry",
      "Other"
    )
    .required()
    .label("Subject")
    .messages({
      "any.only": "Subject must be a valid option",
      "any.required": "Subject is required",
      "string.empty": "Subject cannot be empty",
    }),

  message: Joi.string().min(10).required().label("Message").messages({
    "string.base": "Message must be a string",
    "string.empty": "Message cannot be empty",
    "string.min": "Message must be at least 10 characters",
    "any.required": "Message is required",
  }),
});

export default { contactUsForm };
