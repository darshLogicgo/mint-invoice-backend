// contact/model.js
import mongoose from "mongoose";
import enumConfig from "../config/enum.config.js";

const contactSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    subject: {
      type: String,
      enum: Object.values(enumConfig.contactUsSubjectEnums),
      required: true,
    },
    message: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);
