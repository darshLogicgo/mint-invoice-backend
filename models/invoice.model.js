import mongoose from "mongoose";
import enumConfig from "../config/enum.config.js";

const ItemSchema = new mongoose.Schema({
  description: { type: String, default: null },
  quantity: { type: Number, default: 0 },
  rate: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
});

const InvoiceSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    logo: { type: String, default: null },
    invoiceNumber: { type: String, required: true },

    from: {
      name: { type: String, default: null },
      email: { type: String, default: null },
      address: { type: String, default: null },
      phone: { type: String, default: null },
      businessNumber: { type: String, default: null },
      website: { type: String, default: null },
      owner: { type: String, default: null },
    },

    billTo: {
      name: { type: String, default: null },
      email: { type: String, default: null },
      address: { type: String, default: null },
      phone: { type: String, default: null },
      mobile: { type: String, default: null },
      fax: { type: String, default: null },
    },

    invoiceDate: { type: Date },
    dueDate: { type: Date },

    items: [ItemSchema],

    subtotal: { type: Number },
    total: { type: Number },
    balanceDue: { type: Number },

    signature: { type: String, default: null },

    emailToPreview: { type: String, default: null },

    discount: {
      type: {
        type: String,
        enum: Object.values(enumConfig.discountTypeEnums),
        default: enumConfig.discountTypeEnums.NULL,
      },
      value: { type: Number, default: 0 },
    },
    currency: {
      type: String,
      enum: Object.values(enumConfig.currencyEnums),
      default: enumConfig.currencyEnums.INR,
    },

    template: {
      name: {
        type: String,
        enum: Object.values(enumConfig.templateNameEnums),
        default: enumConfig.templateNameEnums[1],
      },
      color: { type: String, default: null },
    },

    InvoiceUrl: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(enumConfig.invoiceStatusEnums),
      default: null,
    },

    notes: { type: [String], default: [] },
  },
  { timestamps: true }
);

const InvoiceModel = mongoose.model("Invoice", InvoiceSchema);
export default InvoiceModel;
