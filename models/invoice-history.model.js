import mongoose from "mongoose";

const InvoiceHistorySchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    InvoiceUrl: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: false }
);

const InvoiceHistory = mongoose.model("InvoiceHistory", InvoiceHistorySchema);
export default InvoiceHistory; 