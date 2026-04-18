const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const getJwtSecret = () => process.env.JWT_SECRET || process.env.SECRET_KEY;

const signToken = (payload) =>
  jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const createHashedToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  return { rawToken, hashedToken };
};

module.exports = {
  signToken,
  createHashedToken,
};
