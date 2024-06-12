const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const UserModel = require("./models/registerModel");
const { authenticateJWT, authorizeRoles } = require("./middleware/auth");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/employee");

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  UserModel.findOne({ email: email }).then((user) => {
    if (user) {
      if (user.password === password) {
        const token = jwt.sign(
          { email: user.email, role: user.role },
          "your_jwt_secret",
          { expiresIn: "1h" }
        );
        res.json({ token });
      } else {
        res.json("The password is not correct");
      }
    } else {
      res.json("No records of " + email + " in our database");
    }
  });
});

app.post("/register", (req, res) => {
  UserModel.create(req.body)
    .then((users) => res.json(users))
    .catch((err) => res.json(err));
});

app.listen(3001, () => {
  console.log("server is running");
});
