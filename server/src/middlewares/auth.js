const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");
const { getById } = require("../services/authDataService");
const { ensureProfileAndStats } = require("../services/supabaseProfileService");

const getJwtSecret = () => process.env.JWT_SECRET || process.env.SECRET_KEY;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.CLIENT_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SECRET_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

const normalizeRole = (value) => (String(value || "client").toLowerCase() === "admin" ? "admin" : "client");

const resolveSupabaseUser = async (token) => {
  if (!supabase || !token) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }

  const roleHint = normalizeRole(data.user.user_metadata?.role || data.user.app_metadata?.role);
  const profile = await ensureProfileAndStats({
    id: data.user.id,
    email: data.user.email,
    fullName:
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      data.user.email?.split("@")[0] ||
      "",
    role: roleHint,
  });

  return {
    id: data.user.id,
    email: data.user.email,
    role: normalizeRole(profile?.role || roleHint),
  };
};

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

    let decoded = null;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (error) {
      decoded = null;
    }

    if (decoded?.id) {
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
    }

    const supabaseUser = await resolveSupabaseUser(token);
    if (!supabaseUser) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    req.user = supabaseUser;
    req.authRole = supabaseUser.role;
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
