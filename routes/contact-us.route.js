// contact/routes.js
import express from "express";
import validate from "../middleware/validate.js";
import contactFormValidation from "../validation/contact-us.validation.js";
import { createContactMessage } from "../controller/contect-us.controller.js";

const router = express.Router();

router.post(
  "/",
  validate(contactFormValidation.contactUsForm),
  createContactMessage
);

export default router;
