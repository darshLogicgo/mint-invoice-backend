import Joi from "joi";
import { StatusCodes } from "http-status-codes";
import { validateResponse } from "../helper/api-response.helper.js";

/**
 * Picks specific keys from an object
 */
const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

/**
 * Get first required key from Joi schema
 */
const getFirstRequiredFieldName = (schemaObj) => {
  if (!schemaObj || typeof schemaObj.describe !== "function") return null;
  const desc = schemaObj.describe();

  if (desc.type === "object" && desc.keys) {
    for (const key in desc.keys) {
      const field = desc.keys[key];
      if (field?.flags?.presence === "required") {
        return key; // Return the first required field
      }
    }
  }

  return null;
};

/**
 * Middleware to validate request data, including `multipart/form-data`
 */
const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ["params", "query", "body", "files"]);

  if (req.file) {
    req.files = { agreementUrl: req.file };
  }
  if (!req.files) req.files = {};

  const object = pick(req, Object.keys(validSchema));

  const isEmptyInput = ["params", "query", "body", "files"].every((key) => {
    return (
      !object[key] ||
      (typeof object[key] === "object" && Object.keys(object[key]).length === 0)
    );
  });

  if (isEmptyInput) {
    // Check first required key in priority order
    const firstRequiredField =
      getFirstRequiredFieldName(schema.body) ||
      getFirstRequiredFieldName(schema.params) ||
      getFirstRequiredFieldName(schema.query) ||
      getFirstRequiredFieldName(schema.files);

    const message = firstRequiredField
      ? `"${firstRequiredField}" is required.`
      : "Please fill in at least one of the required fields: params, query, body, or files.";

    return validateResponse({
      res,
      error: { message },
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: "key" }, abortEarly: false })
    .validate(object);

  if (error) {
    return validateResponse({
      res,
      error,
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  Object.assign(req, value);
  return next();
};

export default validate;
