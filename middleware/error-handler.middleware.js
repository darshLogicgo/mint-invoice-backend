import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/api-response.helper.js";

const errorHandler = (error, req, res, next) => {
  if (error?.response?.data) {
    return apiResponse({
      res,
      statusCode: error.response.status,
      message: error.response.data.message,
    });
  }

  return apiResponse({
    res,
    statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message: error?.message,
  });
};

export default errorHandler;
