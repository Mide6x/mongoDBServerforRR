const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  phoneNumber: { type: String },
  deliveryArea: { type: String },
  homeAddress: { type: String },
  emailUpdated: { type: Boolean, default: false },
  phoneNumberUpdated: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ["delivery", "finance", "admin"],
    default: "delivery",
  },
  blocked: {
    type: Boolean,
    default: false,
  },
});

const UserModel = mongoose.model("users", UserSchema);
module.exports = UserModel;
