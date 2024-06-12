const mongoose = require("mongoose");

const ReceiptSchema = new mongoose.Schema({
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const ReceiptModel = mongoose.model("receipts", ReceiptSchema);
module.exports = ReceiptModel;
