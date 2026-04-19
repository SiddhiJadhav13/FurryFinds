const { createClient } = require("@supabase/supabase-js");
const { pool } = require("../config/postgres");
const appDataService = require("./appDataService");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.CLIENT_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

const mapProfile = (profile) => {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    fullName: profile.full_name || "",
    full_name: profile.full_name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    address: profile.address || "",
    gender: profile.gender || "",
    dob: profile.dob || null,
    profileImage: profile.profile_image || "",
    profile_image: profile.profile_image || "",
    role: normalizeRole(profile.role),
    createdAt: profile.created_at || null,
    created_at: profile.created_at || null,
  };
};

const ensureProfileAndStats = async ({ id, email, role, fullName }) => {
  const normalizedRole = normalizeRole(role);

  if (pool) {
    const profileResult = await pool.query(
      `
        INSERT INTO profiles (id, full_name, email, role)
        VALUES ($1::uuid, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET
          full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
          email = COALESCE(profiles.email, EXCLUDED.email),
          role = COALESCE(profiles.role, EXCLUDED.role)
        RETURNING *;
      `,
      [id, fullName || "", email || "", normalizedRole]
    );

    if (normalizedRole === "admin") {
      await pool.query(
        `INSERT INTO admin_stats (id) VALUES ($1::uuid) ON CONFLICT (id) DO NOTHING;`,
        [id]
      );
    } else {
      await pool.query(
        `INSERT INTO client_stats (id) VALUES ($1::uuid) ON CONFLICT (id) DO NOTHING;`,
        [id]
      );
    }

    return mapProfile(profileResult.rows[0]);
  }

  if (!supabase) {
    throw new Error("Supabase configuration is missing");
  }

  const payload = {
    id,
    full_name: fullName || "",
    email: email || "",
    role: normalizedRole,
  };

  const profileUpsert = await supabase.from("profiles").upsert(payload).select("*").maybeSingle();
  if (profileUpsert.error) {
    throw profileUpsert.error;
  }

  const statsTable = normalizedRole === "admin" ? "admin_stats" : "client_stats";
  const statsUpsert = await supabase.from(statsTable).upsert({ id });
  if (statsUpsert.error) {
    throw statsUpsert.error;
  }

  return mapProfile(profileUpsert.data);
};

const getProfileById = async (id) => {
  if (pool) {
    const result = await pool.query(`SELECT * FROM profiles WHERE id = $1::uuid LIMIT 1`, [id]);
    return mapProfile(result.rows[0] || null);
  }

  if (!supabase) {
    throw new Error("Supabase configuration is missing");
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw error;
  }

  return mapProfile(data);
};

const updateProfileById = async (id, updates) => {
  const payload = {
    full_name: updates.full_name,
    email: updates.email,
    phone: updates.phone,
    address: updates.address,
    gender: updates.gender,
    dob: updates.dob || null,
    profile_image: updates.profile_image,
  };

  if (pool) {
    const result = await pool.query(
      `
        UPDATE profiles
        SET full_name = COALESCE($1, full_name),
            email = COALESCE($2, email),
            phone = COALESCE($3, phone),
            address = COALESCE($4, address),
            gender = COALESCE($5, gender),
            dob = COALESCE($6::date, dob),
            profile_image = COALESCE($7, profile_image)
        WHERE id = $8::uuid
        RETURNING *;
      `,
      [
        payload.full_name ?? null,
        payload.email ?? null,
        payload.phone ?? null,
        payload.address ?? null,
        payload.gender ?? null,
        payload.dob ?? null,
        payload.profile_image ?? null,
        id,
      ]
    );

    return mapProfile(result.rows[0] || null);
  }

  if (!supabase) {
    throw new Error("Supabase configuration is missing");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapProfile(data);
};

const syncClientStats = async (id) => {
  const [requests, wishlist] = await Promise.all([
    appDataService.getRequestsByClient(id),
    appDataService.getWishlistPetIds(id),
  ]);

  const row = {
    id,
    saved_pets_count: wishlist.length,
    total_requests: requests.length,
    approved_requests: requests.filter((item) => item.status === "approved").length,
  };

  if (pool) {
    const result = await pool.query(
      `
        INSERT INTO client_stats (id, saved_pets_count, total_requests, approved_requests)
        VALUES ($1::uuid, $2, $3, $4)
        ON CONFLICT (id)
        DO UPDATE SET
          saved_pets_count = EXCLUDED.saved_pets_count,
          total_requests = EXCLUDED.total_requests,
          approved_requests = EXCLUDED.approved_requests
        RETURNING *;
      `,
      [id, row.saved_pets_count, row.total_requests, row.approved_requests]
    );
    return result.rows[0] || row;
  }

  if (!supabase) {
    return row;
  }

  const { data, error } = await supabase
    .from("client_stats")
    .upsert(row)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || row;
};

const syncAdminStats = async (id) => {
  const [pets, requests, users] = await Promise.all([
    appDataService.getPets({ filters: {}, sort: "-createdAt" }),
    appDataService.getAllRequests(),
    pool ? pool.query(`SELECT COUNT(*)::int AS total FROM profiles WHERE role = 'client'`) : null,
  ]);

  const totalUsers = users?.rows?.[0]?.total || 0;

  const row = {
    id,
    total_pets: pets.length,
    pending_requests: requests.filter((item) => item.status === "pending").length,
    approved_requests: requests.filter((item) => item.status === "approved").length,
    rejected_requests: requests.filter((item) => item.status === "rejected").length,
    total_users: totalUsers,
  };

  if (pool) {
    const result = await pool.query(
      `
        INSERT INTO admin_stats
          (id, total_pets, pending_requests, approved_requests, rejected_requests, total_users)
        VALUES
          ($1::uuid, $2, $3, $4, $5, $6)
        ON CONFLICT (id)
        DO UPDATE SET
          total_pets = EXCLUDED.total_pets,
          pending_requests = EXCLUDED.pending_requests,
          approved_requests = EXCLUDED.approved_requests,
          rejected_requests = EXCLUDED.rejected_requests,
          total_users = EXCLUDED.total_users
        RETURNING *;
      `,
      [
        id,
        row.total_pets,
        row.pending_requests,
        row.approved_requests,
        row.rejected_requests,
        row.total_users,
      ]
    );
    return result.rows[0] || row;
  }

  if (!supabase) {
    return row;
  }

  const { data, error } = await supabase
    .from("admin_stats")
    .upsert(row)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || row;
};

module.exports = {
  ensureProfileAndStats,
  getProfileById,
  updateProfileById,
  syncClientStats,
  syncAdminStats,
};
