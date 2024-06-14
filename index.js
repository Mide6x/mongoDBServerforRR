const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const UserModel = require("./models/registerModel");
const ReceiptModel = require("./models/receiptModel");
const NotificationModel = require("./models/notificationsModel");
const { authenticateJWT, authorizeRoles } = require("./middleware/auth");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/employee", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//Cron
require("./cron/resetExpiredAcceptances");

// Endpoint for user login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  UserModel.findOne({ email: email }).then((user) => {
    if (user) {
      if (user.blocked) {
        res.status(403).json("Your account is blocked. Please contact admin.");
      } else if (user.password === password) {
        const token = jwt.sign(
          { email: user.email, role: user.role },
          "your_jwt_secret",
          {
            expiresIn: "1h",
          }
        );
        res.json({ token });
      } else {
        res.status(401).json("The password is not correct");
      }
    } else {
      res.status(404).json("No records of " + email + " in our database");
    }
  });
});

// Endpoint for user registration
app.post("/register", (req, res) => {
  UserModel.create(req.body)
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
});

// Endpoint to get all users (admin only)
app.get("/users", authenticateJWT, authorizeRoles("admin"), (req, res) => {
  UserModel.find()
    .then((users) => res.json(users))
    .catch((err) => res.status(500).json(err));
});

// Endpoint to create a new user (admin only)
app.post("/users", authenticateJWT, authorizeRoles("admin"), (req, res) => {
  UserModel.create(req.body)
    .then((user) => res.json(user))
    .catch((err) => res.status(500).json(err));
});

// Endpoint to delete a user (admin only)
app.delete(
  "/users/:id",
  authenticateJWT,
  authorizeRoles("admin"),
  (req, res) => {
    UserModel.findByIdAndDelete(req.params.id)
      .then((user) => res.json(user))
      .catch((err) => res.status(500).json(err));
  }
);

// Endpoint to block/unblock a user (admin only)
app.put(
  "/users/:id/block",
  authenticateJWT,
  authorizeRoles("admin"),
  (req, res) => {
    UserModel.findByIdAndUpdate(req.params.id, { blocked: true }, { new: true })
      .then((user) => res.json(user))
      .catch((err) => res.status(500).json(err));
  }
);

// Endpoint for receipt upload (delivery only)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Endpoint to Upload receipt
app.post(
  "/upload-receipt",
  authenticateJWT,
  authorizeRoles("delivery"),
  upload.single("receipt"),
  (req, res) => {
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { storeName } = req.body;
    if (!storeName) {
      return res.status(400).json({ error: "Store name is required" });
    }

    const newReceipt = new ReceiptModel({
      uploader: req.user._id,
      fileUrl: req.file.path,
      storeName: storeName,
    });

    newReceipt
      .save()
      .then((receipt) => res.json(receipt))
      .catch((err) => {
        console.error("Error saving receipt:", err);
        res.status(500).json(err);
      });
  }
);

// Endpoint to get all receipts
app.get(
  "/receipts",
  authenticateJWT,
  authorizeRoles("delivery"),
  (req, res) => {
    ReceiptModel.find()
      .populate("uploader", "email") // Populate uploader field with email
      .then((receipts) => res.json(receipts))
      .catch((err) => res.status(500).json(err));
  }
);

// Endpoint to get profile page
app.get("/profile", authenticateJWT, (req, res) => {
  UserModel.findById(req.user._id)
    .then((user) => res.json(user))
    .catch((err) => res.status(500).json(err));
});

// Endpoint to Update Profile
app.put("/profile", authenticateJWT, (req, res) => {
  const { phoneNumber, deliveryArea, homeAddress } = req.body;

  const updateFields = {
    deliveryArea,
    homeAddress,
  };

  if (req.body.phoneNumber && !req.user.phoneNumberUpdated) {
    updateFields.phoneNumber = req.body.phoneNumber;
    updateFields.phoneNumberUpdated = true;
  }

  UserModel.findByIdAndUpdate(req.user._id, updateFields, { new: true })
    .then((user) => res.json(user))
    .catch((err) => res.status(500).json(err));
});

//Endpoint to Update profile picture
app.post(
  "/profile-picture",
  authenticateJWT,
  upload.single("profilePicture"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    UserModel.findByIdAndUpdate(
      req.user._id,
      { profilePicture: req.file.path },
      { new: true }
    )
      .then((user) => res.json(user))
      .catch((err) => res.status(500).json(err));
  }
);

// Endpoint for Notification Upload
app.post(
  "/notifications",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    const { deliveryArea, storeName, sellerContact, item, quantity } = req.body;

    if (!deliveryArea || !storeName || !sellerContact || !item || !quantity) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const notification = new NotificationModel({
        deliveryArea,
        storeName,
        sellerContact,
        item,
        quantity,
      });

      await notification.save();
      res.status(201).json({ message: "Notification created successfully" });
    } catch (err) {
      console.error("Error creating notification:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Endpoint to Fetch Notifications
app.get("/notifications", authenticateJWT, async (req, res) => {
  const deliveryArea = req.user.deliveryArea; // Assuming `deliveryArea` is part of the user data

  try {
    const notifications = await NotificationModel.find({
      deliveryArea,
    });
    res.status(200).json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint for accepting delivery
app.post("/notifications/:id/accept", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    let notification = await NotificationModel.findById(id);

    if (notification.accepted) {
      return res.status(400).json({
        error: "This delivery notification has already been accepted.",
      });
    }

    notification.accepted = true;
    notification.acceptedBy = userId;
    notification.acceptedAt = new Date();
    await notification.save();

    res.status(200).json(notification);
  } catch (err) {
    console.error("Error accepting notification:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint for marking delivery as delivered
app.post("/notifications/:id/delivered", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    let notification = await NotificationModel.findById(id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.acceptedBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You did not accept this delivery" });
    }

    notification.deliveredAt = new Date();
    await notification.save();

    res.status(200).json(notification);
  } catch (err) {
    console.error("Error marking notification as delivered:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to Fetch Accepted Notifications for Admin
app.get("/notifications/accepted", authenticateJWT, async (req, res) => {
  try {
    const notifications = await NotificationModel.find({
      accepted: true,
    }).populate("acceptedBy", "email");

    res.status(200).json(notifications);
  } catch (err) {
    console.error("Error fetching accepted notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get Receipts
app.get("/receipts/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const receipts = await ReceiptModel.find({ uploader: userId }).exec();
    res.json(receipts);
  } catch (err) {
    console.error("Error fetching receipts:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3001, () => {
  console.log("server is running");
});
