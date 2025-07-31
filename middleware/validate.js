import { apiResponse } from "../helper/api-response.helper.js";
import { StatusCodes } from "http-status-codes";

const validate = (schema) => (req, res, next) => {
  // Check if a schema was provided.
  if (!schema) {
    return apiResponse({
      res,
      statusCode: StatusCodes.BAD_REQUEST,
      message: "Validation schema not found",
    });
  }

  // Validate the request body against the provided schema.
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  // If validation fails, format and return the error messages.
  if (error) {
    // Extract and format the validation error messages from the error details.
    const errorMessage = error.details[0].message;

    return apiResponse({
      res,
      statusCode: StatusCodes.BAD_REQUEST,
      message: errorMessage, // Return formatted error messages.
    });
  }

  // If validation succeeds, proceed to the next middleware or route handler.
  next();
};

export default validate;
