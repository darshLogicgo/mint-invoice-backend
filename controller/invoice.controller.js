import { apiResponse } from "../helper/api-response.helper.js";
import Invoice from "../models/invoice.model.js";
import s3Service from "../upload/service.js";
import { v4 as uuidv4 } from "uuid";
import { StatusCodes } from "http-status-codes";
import UserModel from "../models/user.model.js";
import helper from "../helper/common.helper.js";
import fileService from "../upload/service.js";
import { sendEmail } from "../helper/mail.js";
import InvoiceHistory from "../models/invoice-history.model.js";
import puppeteer from "puppeteer";

// Helper to upload a file to S3 and return the URL
async function handleUpload(file, oldUrl, folder) {
  if (!file) return oldUrl;
  if (oldUrl) {
    return await s3Service.updateFile({
      url: oldUrl,
      uuid: uuidv4(),
      folderName: folder,
      mimetype: file.mimetype,
      buffer: file.buffer,
    });
  } else {
    return await s3Service.uploadFile({
      mimetype: file.mimetype,
      uuid: uuidv4(),
      folderName: folder,
      buffer: file.buffer,
    });
  }
}

function parseIfNeeded(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

const createInvoice = async (req, res) => {
  try {
    const {
      logo: logoFile,
      signature: signatureFile,
      InvoiceUrl: InvoiceUrlFile,
    } = req.files || {};

    const {
      invoiceNumber,
      from,
      billTo,
      invoiceDate,
      dueDate,
      items,
      discount,
      currency,
      template,
      status,
      emailToPreview,
      notes,
    } = req.body;

    const userId = req.user._id;
    const user = await UserModel.findById(userId);
    const now = new Date();

    // 🔁 Reset monthly usage if due
    if (!user.subscription.resetAt || now > user.subscription.resetAt) {
      user.subscription.used = 0;
      user.subscription.resetAt = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      );
      await user.save();
    }

    // ❌ Enforce invoice limits
    if (
      user.subscription.plan !== "unlimited" &&
      user.subscription.used >= user.subscription.limit
    ) {
      return apiResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: "Invoice limit reached. Please upgrade your plan.",
      });
    }

    // ✅ Upload files
    const logoUrl = logoFile
      ? await handleUpload(logoFile[0], null, "logo")
      : undefined;
    const signatureUrl = signatureFile
      ? await handleUpload(signatureFile[0], null, "signature")
      : undefined;
    const InvoiceUrl = InvoiceUrlFile
      ? await handleUpload(InvoiceUrlFile[0], null, "InvoiceUrl")
      : undefined;

    // ✅ Parse if stringified
    const parsedItems = parseIfNeeded(items);
    const parsedDiscount = parseIfNeeded(discount);
    const parsedTemplate = parseIfNeeded(template);
    const parsedFrom = parseIfNeeded(from);
    const parsedBillTo = parseIfNeeded(billTo);

    // ✅ Server-side amount calculations
    const itemsWithAmount = parsedItems.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const amount = quantity * rate;
      return {
        description: item.description,
        quantity,
        rate,
        amount,
      };
    });

    const subtotal = itemsWithAmount.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    let discountAmount = 0;
    if (parsedDiscount?.type === "percentage") {
      discountAmount = (parsedDiscount.value / 100) * subtotal;
    } else if (parsedDiscount?.type === "flat") {
      discountAmount = parsedDiscount.value || 0;
    } else if (parsedDiscount?.type === "none" || !parsedDiscount?.type) {
      discountAmount = 0;
    }

    const total = subtotal - discountAmount;
    const balanceDue = total; // Later support for partial payments

    // ✅ Save invoice
    const invoice = await Invoice.create({
      createdBy: userId,
      invoiceNumber,
      from: parsedFrom,
      billTo: parsedBillTo,
      invoiceDate,
      dueDate,
      items: itemsWithAmount,
      subtotal,
      total,
      balanceDue,
      logo: logoUrl,
      signature: signatureUrl,
      emailToPreview,
      notes,
      discount: parsedDiscount,
      currency,
      template: parsedTemplate,
      InvoiceUrl,
      status,
    });

    // ✅ Track usage
    user.subscription.used += 1;
    await user.save();

    return apiResponse({
      res,
      statusCode: StatusCodes.CREATED,
      message: "Invoice created successfully",
      data: invoice,
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

const getAllInvoices = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { status, search, page = 1, limit = 10 } = req.query;

    const filter = { createdBy: userId };

    // Apply status filter if provided
    if (status && ["paid", "outstanding"].includes(status.toLowerCase())) {
      filter.status = status.toLowerCase();
    }

    // Apply search filter on client name (case-insensitive)
    if (search) {
      filter["billTo.name"] = { $regex: search, $options: "i" };
    }

    const { skip, limit: parsedLimit } = helper.paginationFun({ page, limit });

    // Count total items before pagination
    const totalItems = await Invoice.countDocuments(filter);

    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const pagination = helper.paginationDetails({
      page,
      totalItems,
      limit: parsedLimit,
    });

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Invoices fetched successfully",
      data: {
        pagination,
        invoices,
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

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "Invoice not found",
      });
    }
    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Invoice fetched successfully",
      data: invoice,
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

const updateInvoice = async (req, res) => {
  try {
    const {
      logo: logoFile,
      signature: signatureFile,
      InvoiceUrl: InvoiceUrlFile,
    } = req.files || {};

    console.log("logo", logoFile);

    const {
      invoiceNumber,
      from,
      billTo,
      invoiceDate,
      dueDate,
      items,
      discount,
      currency,
      template,
      status,
      emailToPreview,
      notes,
    } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "Invoice not found",
      });
    }

    // Save history before update (only if InvoiceUrl exists)
    if (invoice.InvoiceUrl) {
      await InvoiceHistory.create({
        invoiceId: invoice._id,
        InvoiceUrl: invoice.InvoiceUrl,
        updatedAt: new Date(),
      });
    }

    // ✅ Upload new files or keep old URLs
    const logoUrl = logoFile
      ? await handleUpload(logoFile[0], invoice.logo, "logo")
      : req.body.logo === null || req.body.logo === "null"
      ? null
      : invoice.logo;

    const signatureUrl = signatureFile
      ? await handleUpload(signatureFile[0], invoice.signature, "signature")
      : req.body.signature === null || req.body.signature === "null"
      ? null
      : invoice.signature;

    const InvoiceUrl = InvoiceUrlFile
      ? await handleUpload(InvoiceUrlFile[0], invoice.InvoiceUrl, "InvoiceUrl")
      : invoice.InvoiceUrl;

    // ✅ Safe parsing like createInvoice
    const parseIfNeeded = (data) =>
      typeof data === "string" ? JSON.parse(data) : data;

    const parsedItems = parseIfNeeded(items) || [];
    const parsedDiscount = parseIfNeeded(discount) || {};
    const parsedTemplate = parseIfNeeded(template) || {};
    const parsedFrom = parseIfNeeded(from) || {};
    const parsedBillTo = parseIfNeeded(billTo) || {};

    // ✅ Recalculate item-wise amounts
    const itemsWithAmount = parsedItems?.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const amount = quantity * rate;
      return {
        description: item.description,
        quantity,
        rate,
        amount,
      };
    });

    const subtotal = itemsWithAmount?.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    let discountAmount = 0;
    if (parsedDiscount?.type === "percentage") {
      discountAmount = (parsedDiscount.value / 100) * subtotal;
    } else if (parsedDiscount?.type === "flat") {
      discountAmount = parsedDiscount.value || 0;
    } else if (parsedDiscount?.type === "none" || !parsedDiscount?.type) {
      discountAmount = 0;
    }

    const total = subtotal - discountAmount;
    const balanceDue = total; 

    const finalStatus = status === null || status === "null" ? null : status;

    // ✅ Assign updated fields
    Object.assign(invoice, {
      invoiceNumber,
      from: parsedFrom,
      billTo: parsedBillTo,
      invoiceDate,
      dueDate,
      items: itemsWithAmount,
      subtotal,
      total,
      balanceDue,
      emailToPreview,
      notes,
      discount: parsedDiscount,
      currency,
      template: parsedTemplate,
      logo: logoUrl,
      signature: signatureUrl,
      InvoiceUrl,
      status: finalStatus,
    });

    await invoice.save();

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Invoice updated successfully",
      data: invoice,
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

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "Invoice not found",
      });
    }

    // Get the user who created this invoice
    const user = await UserModel.findById(invoice.createdBy);
    if (!user) {
      return apiResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    // Delete the invoice
    await Invoice.findByIdAndDelete(req.params.id);

    // Decrease the used count in user's subscription
    if (user.subscription && user.subscription.used > 0) {
      user.subscription.used = Math.max(0, user.subscription.used - 1);
      await user.save();
    }

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Invoice deleted successfully",
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

const sendInvoiceToEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const file = req.file;

    if (!file) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "File is required",
      });
    }

    if (!email) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Recipient email is required",
      });
    }

    // ✅ Upload file to S3 or DigitalOcean Spaces
    const uploadedUrl = await fileService.uploadFile({
      buffer: file.buffer,
      mimetype: file.mimetype,
      uuid: uuidv4(),
      folderName: "invoices",
    });

    await sendEmail(email, "Your Invoice is Ready", "invoice", {
      url: uploadedUrl,
      email,
    });

    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Invoice sent successfully",
      data: { url: uploadedUrl },
    });
  } catch (error) {
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Failed to send invoice",
      error: error.message,
    });
  }
};

const getInvoiceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await InvoiceHistory.find({ invoiceId: id }).sort({
      updatedAt: -1,
    });
    // .select("InvoiceUrl updatedAt");
    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Invoice history fetched successfully",
      data: history,
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

const generatePDF = async (req, res) => {
  try {
    const { html } = req.body;

    if (!html) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "HTML content is required",
      });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="invoice.pdf"',
    });
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Failed to generate PDF",
      error: error.message,
    });
  }
};

export default {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  sendInvoiceToEmail,
  getInvoiceHistory,
  generatePDF,
};
