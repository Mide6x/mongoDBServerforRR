const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  deliveryArea: {
    type: String,
    required: true,
  },
  storeName: {
    type: String,
    required: true,
  },
  sellerContact: {
    type: String,
    required: true,
  },
  item: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    default: null,
  },
  acceptedAt: {
    type: Date,
    default: null,
  },
  deliveredAt: {
    type: Date,
    default: null,
  },
  accepted: {
    type: Boolean,
    default: false,
  },
});

const NotificationModel = mongoose.model("notifications", NotificationSchema);
module.exports = NotificationModel;
