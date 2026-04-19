const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../config/mailer");
const { signToken, createHashedToken } = require("../utils/tokens");
const {
  createUser,
  findByEmail,
  findByEmailAndRole,
  getById,
  setEmailVerification,
  verifyEmail: verifyEmailToken,
  setPasswordReset,
  resetPassword: resetPasswordToken,
} = require("../services/authDataService");

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.is_verified,
  phone: user.phone,
  address: user.address,
  avatar: user.avatar,
});

const sendVerification = async (user) => {
  const { rawToken, hashedToken } = createHashedToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await setEmailVerification(user.id, hashedToken, expiresAt);

  const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}&email=${encodeURIComponent(
    user.email
  )}`;

  await sendMail({
    to: user.email,
    subject: "Verify your Verifies account",
    html: `<p>Hello ${user.name},</p>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verifyLink}">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>`,
  });
};

const register = (role) => async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const normalizedEmail = email.toLowerCase();

  const exists = await findByEmail(normalizedEmail);
  if (exists) {
    return res.status(409).json({ success: false, message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({
    name,
    email: normalizedEmail,
    passwordHash,
    role,
  });

  const token = signToken({ id: user.id, role: user.role });
  setAuthCookie(res, token);

  let emailNotice = "";
  try {
    await sendVerification(user);
  } catch (error) {
    emailNotice = " Email service is currently unavailable; please try verification again later.";
  }

  return res.status(201).json({
    success: true,
    message: `Registration successful. Please verify your email.${emailNotice}`,
    token,
    user: sanitizeUser(user)
  });
};

const login = (role) => async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = await findByEmailAndRole(email.toLowerCase(), role);

  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const matched = await bcrypt.compare(password, user.password_hash);
  if (!matched) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const token = signToken({ id: user.id, role: user.role });
  setAuthCookie(res, token);

  return res.json({ success: true, token, user: sanitizeUser(user) });
};

const verifyEmail = async (req, res) => {
  const { email, token } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token || "").digest("hex");
  const isVerified = await verifyEmailToken(email?.toLowerCase(), hashedToken);

  if (!isVerified) {
    return res.status(400).json({ success: false, message: "Invalid or expired token" });
  }

  return res.json({ success: true, message: "Email verified successfully" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const user = await findByEmail(email.toLowerCase());
  if (!user) {
    return res.json({ success: true, message: "If account exists, reset link has been sent" });
  }

  const { rawToken, hashedToken } = createHashedToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

  await setPasswordReset(user.id, hashedToken, resetExpires);

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(
    user.email
  )}`;

  try {
    await sendMail({
      to: user.email,
      subject: "Reset your Verifies password",
      html: `<p>Hello ${user.name},</p>
        <p>Reset your password using the link below:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>`,
    });
  } catch (error) {
    // Don't reveal email delivery problems to avoid account enumeration details.
  }

  return res.json({ success: true, message: "If account exists, reset link has been sent" });
};

const resetPassword = async (req, res) => {
  const { email, token, password } = req.body;

  if (!email || !token || !password) {
    return res.status(400).json({ success: false, message: "Email, token and password are required" });
  }

  const hashedToken = crypto.createHash("sha256").update(token || "").digest("hex");
  const newHash = await bcrypt.hash(password, 10);

  const updated = await resetPasswordToken(email.toLowerCase(), hashedToken, newHash);

  if (!updated) {
    return res.status(400).json({ success: false, message: "Invalid or expired token" });
  }

  return res.json({ success: true, message: "Password reset successful" });
};

const getMe = async (req, res) => {
  const user = await getById(req.user.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.json({ success: true, user: sanitizeUser(user), wishlist: [] });
};

const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.json({ success: true, message: "Logged out successfully" });
};

module.exports = {
  registerClient: register("client"),
  registerAdmin: register("admin"),
  loginClient: login("client"),
  loginAdmin: login("admin"),
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
};
