import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import env from "../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const transporter = nodemailer.createTransport({
//   service: env.email.service,
//   auth: {
//     user: env.email.user,
//     pass: env.email.pass,
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });

// export const sendEmail = async (
//   email,
//   subject,
//   templateName,
//   templateData,
//   attachments = []
// ) => {
//   try {
//     const templatePath = path.resolve(
//       __dirname,
//       `../views/${templateName}.html`
//     );

//     const emailTemplate = await ejs.renderFile(templatePath, templateData);

//     const mailOptions = {
//       from: env.email.user,
//       to: email,
//       subject: subject,
//       html: emailTemplate,
//       attachments: attachments,
//     };

//     const info = await transporter.sendMail(mailOptions);

//     console.log("Email sent successfully: " + info.response);
//     return info;
//   } catch (error) {
//     console.error("Error sending email:", error.message);
//     throw new Error("Failed to send email. Please check the logs for details.");
//   }
// };


const transporter = nodemailer.createTransport({
  service: env.email.from,
  auth: {
    user: env.nodemailer.auth.user,
    pass: env.nodemailer.auth.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async (
  email,
  subject,
  templateName,
  templateData,
  attachments = []
) => {
  try {
    let emailTemplate;
    
    // If custom HTML content is provided, use it directly
    if (templateData.htmlContent) {
      emailTemplate = templateData.htmlContent;
    } else {
      // Otherwise use the template file
      const templatePath = path.resolve(
        __dirname,
        `../views/${templateName}.html`
      );

      emailTemplate = await ejs.renderFile(templatePath, templateData, {
        async: true, 
      });
    }

    const mailOptions = {
      from: env.email.from,
      to: email,
      subject: subject,
      html: emailTemplate,
      attachments: attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email. Please check the logs for details.");
  }
};
