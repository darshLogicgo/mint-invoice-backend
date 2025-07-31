import Joi from "joi";

const guestLogin = Joi.object({
  deviceId: Joi.string().required().label("Device ID").messages({
    "string.base": "Device ID must be a string",
    "any.required": "Device ID is required",
    "string.empty": "Device ID cannot be empty",
  }),
});

export default { guestLogin };
