const jwt = require("jsonwebtoken");
const { getById } = require("../services/authDataService");

const getJwtSecret = () => process.env.JWT_SECRET || process.env.SECRET_KEY;

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await getById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = {
      ...user,
      role: user.role || decoded.role,
    };
    req.authRole = decoded.role;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const authorize = (...roles) => (req, res, next) => {
  const normalizedAllowed = roles.map((role) => String(role).toLowerCase().trim());
  const effectiveRole = String(req.user?.role || req.authRole || "")
    .toLowerCase()
    .trim();

  if (!normalizedAllowed.includes(effectiveRole)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  return next();
};

module.exports = { protect, authorize };
