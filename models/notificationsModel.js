const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  deliveryArea: String,
  storeName: String,
  sellerContact: String,
  item: String,
  quantity: Number,
  accepted: { type: Boolean, default: false },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    default: null,
  },
  acceptedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
});

const NotificationModel = mongoose.model("Notification", notificationSchema);

module.exports = NotificationModel;
