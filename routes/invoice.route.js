import express from "express";
import upload from "../config/multer.config.js";
import invoiceController from "../controller/invoice.controller.js";
import { verifyToken } from "../middleware/verify-token.middleware.js";

const router = express.Router();

// Create invoice (with file upload)
router.post(
  "/",
  verifyToken,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "InvoiceUrl", maxCount: 1 },
  ]),
  invoiceController.createInvoice
);

// Get all invoices
router.get("/", verifyToken, invoiceController.getAllInvoices);

// Get single invoice
router.get("/:id", verifyToken, invoiceController.getInvoiceById);

// Get invoice history
router.get("/:id/history", verifyToken, invoiceController.getInvoiceHistory);

// Update invoice (with file upload)
router.patch(
  "/:id",
  verifyToken,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "InvoiceUrl", maxCount: 1 },
  ]),
  invoiceController.updateInvoice
);

// Delete invoice
router.delete("/:id", verifyToken, invoiceController.deleteInvoice);

router.post(
  "/send-invoice",
  verifyToken,
  upload.single("invoice"),
  invoiceController.sendInvoiceToEmail
);

// Generate PDF from HTML
router.post("/generate-pdf", verifyToken, invoiceController.generatePDF);

export default router;
