import { apiResponse } from "../helper/api-response.helper.js";
import UserModel from "../models/user.model.js";
import helper from "../helper/common.helper.js";
import { StatusCodes } from "http-status-codes";

// auth.controller.js
const guestLogin = async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "deviceId is required",
      });
    }

    let user = await UserModel.findOne({ deviceId });

    // If user not found, create new guest user
    if (!user) {
      user = await UserModel.create({
        deviceId,
      });
    }

    // You can generate JWT here if needed
    const token = await helper.generateToken({ userId: user._id });

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Guest login successful",
      data: {
        token,
        user,
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

export default { guestLogin };
