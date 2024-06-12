const jwt = require("jsonwebtoken");
const User = require("../models/registerModel"); // Adjust the path as necessary

const authenticateJWT = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, "your_jwt_secret", (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = { authenticateJWT, authorizeRoles };
