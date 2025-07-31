// import upload from "../../config/multer.config.js";
import validate from "../middleware/validate.js";
// import { verifyToken } from "../../middleware/verifyToken.js";
import authController from "../controller/auth.controller.js";
import authValidation from "../validation/auth.validation.js";
import express from "express";

const route = express.Router();
route.post(
  "/guest/login",
//   upload.none(),
  validate(authValidation.guestLogin),
  authController.guestLogin
);

export default route;
