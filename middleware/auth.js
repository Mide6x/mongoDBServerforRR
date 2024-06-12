// middleware/auth.js
const jwt = require("jsonwebtoken");
const UserModel = require("../models/registerModel");

const authenticateJWT = (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (token) {
    jwt.verify(token, "your_jwt_secret", (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      UserModel.findOne({ email: user.email })
        .then((userData) => {
          if (!userData) {
            return res.sendStatus(403);
          }
          req.user = userData;
          next();
        })
        .catch((error) => {
          res.status(500).json({ error });
        });
    });
  } else {
    res.sendStatus(401);
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.sendStatus(403);
    }
    next();
  };
};

module.exports = { authenticateJWT, authorizeRoles };
