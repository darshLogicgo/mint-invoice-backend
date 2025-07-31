import ContactModel from "../models/contact-us.model.js";
import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/api-response.helper.js";
import { sendEmail } from "../helper/mail.js";

export const createContactMessage = async (req, res) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    const contact = await ContactModel.create({
      firstName,
      lastName,
      email,
      subject,
      message,
    });

    // Send Email
    await sendEmail(
      email, 
      `Contact Us Request: ${subject}`,
      "contact", //
      {
        fullName: `${firstName} ${lastName}`,
        subject,
        message,
      }
    );

    return apiResponse({
      res,
      statusCode: StatusCodes.CREATED,
      status: true,
      message: "Your message has been received. We will contact you soon.",
      data: contact,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      status: false,
      message: "Failed to submit message.",
    });
  }
};
