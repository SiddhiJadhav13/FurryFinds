const fs = require("fs/promises");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { pool } = require("../config/postgres");

const resolveAuthTable = () => {
  const candidate = process.env.AUTH_TABLE || "registration";
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(candidate) ? candidate : "registration";
};

const AUTH_TABLE = resolveAuthTable();
const AUTH_FORCE_DB = String(process.env.AUTH_FORCE_DB || "true").toLowerCase() !== "false";
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

const DATA_FILE = path.join(process.cwd(), "data", "auth-users.json");
const RESET_FILE = path.join(process.cwd(), "data", "password-resets.json");

const isDbConnectivityError = (error) => {
  const message = String(error?.message || "").toLowerCase();

  if (["ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT", "EHOSTUNREACH"].includes(error?.code)) {
    return true;
  }

  return (
    message.includes("tenant or user not found") ||
    message.includes("self-signed certificate") ||
    message.includes("getaddrinfo") ||
    message.includes("connect econnrefused") ||
    message.includes("connection terminated")
  );
};

const ensureDataFile = async () => {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ users: [] }, null, 2), "utf8");
  }
};

const readLocal = async () => {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
  };
};

const writeLocal = async (users) => {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify({ users }, null, 2), "utf8");
};

const readResetStore = async () => {
  const dir = path.dirname(RESET_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(RESET_FILE);
  } catch {
    await fs.writeFile(RESET_FILE, JSON.stringify({ items: {} }, null, 2), "utf8");
  }

  const raw = await fs.readFile(RESET_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  return {
    items: parsed.items || {},
  };
};

const writeResetStore = async (items) => {
  const dir = path.dirname(RESET_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(RESET_FILE, JSON.stringify({ items }, null, 2), "utf8");
};

const mapRow = (row) => {
  if (!row) return null;

  const derivedId = row.id ?? row.email;
  return {
    ...row,
    id: derivedId,
    password_hash: row.password_hash ?? row.password,
    is_verified: row.is_verified ?? true,
  };
};

const withFallback = async (dbFn, supabaseFn, fallbackFn) => {
  if (!pool) {
    if (supabase && supabaseFn) {
      return supabaseFn();
    }
    if (AUTH_FORCE_DB) {
      const error = new Error("Database service is currently unavailable. Please try again in a moment.");
      error.code = "ENOTFOUND";
      throw error;
    }
    return fallbackFn();
  }

  try {
    return await dbFn();
  } catch (error) {
    if (isDbConnectivityError(error)) {
      if (supabase && supabaseFn) {
        return supabaseFn();
      }
      if (AUTH_FORCE_DB) {
        throw error;
      }
      return fallbackFn();
    }
    throw error;
  }
};

const createUser = async ({ name, email, passwordHash, role }) =>
  withFallback(
    async () => {
      const result = await pool.query(
        `
          INSERT INTO ${AUTH_TABLE} (name, email, password, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, email, role, is_verified, phone, address, avatar
        `,
        [name, email, passwordHash, role]
      );
      return result.rows[0];
    },
    async () => {
      const fullInsert = await supabase
        .from(AUTH_TABLE)
        .insert({
          name,
          email,
          password: passwordHash,
          role,
          is_verified: false,
        })
        .select("*")
        .maybeSingle();

      if (!fullInsert.error) {
        return mapRow(fullInsert.data) || { id: email, name, email, role, is_verified: true };
      }

      // Some user-created tables only have name/email/password/created_at.
      const minimalInsert = await supabase
        .from(AUTH_TABLE)
        .insert({
          name,
          email,
          password: passwordHash,
        })
        .select("*")
        .maybeSingle();

      if (minimalInsert.error) throw minimalInsert.error;
      return mapRow(minimalInsert.data) || { id: email, name, email, role, is_verified: true };
    },
    async () => {
      const db = await readLocal();
      const nextId = (Math.max(0, ...db.users.map((u) => Number(u.id) || 0)) + 1).toString();
      const user = {
        id: nextId,
        name,
        email,
        password_hash: passwordHash,
        role,
        is_verified: false,
        email_verification_token: null,
        email_verification_expires: null,
        password_reset_token: null,
        password_reset_expires: null,
        phone: "",
        address: "",
        avatar: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.users.push(user);
      await writeLocal(db.users);
      return user;
    }
  );

const findByEmail = async (email) =>
  withFallback(
    async () => {
      const result = await pool.query(
        `
          SELECT id, name, email, password AS password_hash, role, is_verified, phone, address, avatar,
                 email_verification_token, email_verification_expires,
                 password_reset_token, password_reset_expires
          FROM ${AUTH_TABLE}
          WHERE email = $1
          LIMIT 1
        `,
        [email]
      );
      return result.rows[0] || null;
    },
    async () => {
      const { data, error } = await supabase
        .from(AUTH_TABLE)
        .select("*")
        .eq("email", email)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return mapRow(data);
    },
    async () => {
      const db = await readLocal();
      return db.users.find((u) => u.email === email) || null;
    }
  );

const findByEmailAndRole = async (email, role) => {
  const user = await findByEmail(email);
  if (!user) {
    return null;
  }

  if (!user.role) {
    return { ...user, role };
  }

  if (user.role !== role) {
    return null;
  }

  return user;
};

const getById = async (id) =>
  withFallback(
    async () => {
      const result = await pool.query(
        `
          SELECT id, name, email, role, is_verified, phone, address, avatar
          FROM ${AUTH_TABLE}
          WHERE id = $1
          LIMIT 1
        `,
        [id]
      );
      return result.rows[0] || null;
    },
    async () => {
      const identifierColumn = String(id).includes("@") ? "email" : "id";
      const { data, error } = await supabase
        .from(AUTH_TABLE)
        .select("*")
        .eq(identifierColumn, id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return mapRow(data);
    },
    async () => {
      const db = await readLocal();
      const user = db.users.find((u) => String(u.id) === String(id));
      if (!user) return null;
      const { password_hash, ...safe } = user;
      return safe;
    }
  );

const setEmailVerification = async (id, token, expiresAt) =>
  withFallback(
    async () => {
      await pool.query(
        `
          UPDATE ${AUTH_TABLE}
          SET email_verification_token = $1,
              email_verification_expires = $2,
              updated_at = NOW()
          WHERE id = $3
        `,
        [token, expiresAt, id]
      );
      return true;
    },
    async () => {
      const identifierColumn = String(id).includes("@") ? "email" : "id";
      const { error } = await supabase
        .from(AUTH_TABLE)
        .update({
          email_verification_token: token,
          email_verification_expires: new Date(expiresAt).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq(identifierColumn, id);
      if (error) {
        // Ignore if the table does not support verification columns.
        if (String(error.message || "").toLowerCase().includes("column")) return true;
        throw error;
      }
      return true;
    },
    async () => {
      const db = await readLocal();
      const index = db.users.findIndex((u) => String(u.id) === String(id));
      if (index === -1) return false;
      db.users[index].email_verification_token = token;
      db.users[index].email_verification_expires = new Date(expiresAt).toISOString();
      db.users[index].updated_at = new Date().toISOString();
      await writeLocal(db.users);
      return true;
    }
  );

const verifyEmail = async (email, token) =>
  withFallback(
    async () => {
      const result = await pool.query(
        `
          UPDATE ${AUTH_TABLE}
          SET is_verified = TRUE,
              email_verification_token = NULL,
              email_verification_expires = NULL,
              updated_at = NOW()
          WHERE email = $1
            AND email_verification_token = $2
            AND email_verification_expires > NOW()
          RETURNING id
        `,
        [email, token]
      );
      return result.rows.length > 0;
    },
    async () => {
      // Probe actual columns in this user-managed table first.
      const probe = await supabase.from(AUTH_TABLE).select("*").eq("email", email).limit(1).maybeSingle();
      if (probe.error) throw probe.error;
      if (!probe.data) return false;

      const row = probe.data;
      const hasTokenColumn = Object.prototype.hasOwnProperty.call(row, "email_verification_token");
      const hasExpiresColumn = Object.prototype.hasOwnProperty.call(row, "email_verification_expires");
      const hasVerifiedColumn = Object.prototype.hasOwnProperty.call(row, "is_verified");
      const hasUpdatedAtColumn = Object.prototype.hasOwnProperty.call(row, "updated_at");

      // Minimal schema: no verification columns exist, so accept as verified by existence.
      if (!hasTokenColumn && !hasExpiresColumn && !hasVerifiedColumn) {
        return true;
      }

      // If token/expiry columns exist, enforce token check.
      if (hasTokenColumn) {
        if ((row.email_verification_token || null) !== token) {
          return false;
        }
      }

      if (hasExpiresColumn && row.email_verification_expires) {
        const expires = new Date(row.email_verification_expires).getTime();
        if (Number.isFinite(expires) && expires <= Date.now()) {
          return false;
        }
      }

      const updatePayload = {};
      if (hasVerifiedColumn) updatePayload.is_verified = true;
      if (hasTokenColumn) updatePayload.email_verification_token = null;
      if (hasExpiresColumn) updatePayload.email_verification_expires = null;
      if (hasUpdatedAtColumn) updatePayload.updated_at = new Date().toISOString();

      if (Object.keys(updatePayload).length === 0) {
        return true;
      }

      const update = await supabase
        .from(AUTH_TABLE)
        .update(updatePayload)
        .eq("email", email)
        .select("email")
        .limit(1)
        .maybeSingle();

      if (update.error) throw update.error;
      return Boolean(update.data);
    },
    async () => {
      const db = await readLocal();
      const now = Date.now();
      const index = db.users.findIndex((u) => {
        const expires = u.email_verification_expires ? new Date(u.email_verification_expires).getTime() : 0;
        return u.email === email && u.email_verification_token === token && expires > now;
      });
      if (index === -1) return false;
      db.users[index].is_verified = true;
      db.users[index].email_verification_token = null;
      db.users[index].email_verification_expires = null;
      db.users[index].updated_at = new Date().toISOString();
      await writeLocal(db.users);
      return true;
    }
  );

const setPasswordReset = async (id, token, expiresAt) =>
  withFallback(
    async () => {
      await pool.query(
        `
          UPDATE ${AUTH_TABLE}
          SET password_reset_token = $1,
              password_reset_expires = $2,
              updated_at = NOW()
          WHERE id = $3
        `,
        [token, expiresAt, id]
      );
      return true;
    },
    async () => {
      const identifierColumn = String(id).includes("@") ? "email" : "id";
      const { error } = await supabase
        .from(AUTH_TABLE)
        .update({
          password_reset_token: token,
          password_reset_expires: new Date(expiresAt).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq(identifierColumn, id);
      if (error) {
        if (String(error.message || "").toLowerCase().includes("column")) {
          const store = await readResetStore();
          store.items[String(id).toLowerCase()] = {
            token,
            expiresAt: new Date(expiresAt).toISOString(),
          };
          await writeResetStore(store.items);
          return true;
        }
        throw error;
      }
      return true;
    },
    async () => {
      const db = await readLocal();
      const index = db.users.findIndex((u) => String(u.id) === String(id));
      if (index === -1) return false;
      db.users[index].password_reset_token = token;
      db.users[index].password_reset_expires = new Date(expiresAt).toISOString();
      db.users[index].updated_at = new Date().toISOString();
      await writeLocal(db.users);
      return true;
    }
  );

const resetPassword = async (email, token, newHash) =>
  withFallback(
    async () => {
      const result = await pool.query(
        `
          UPDATE ${AUTH_TABLE}
          SET password = $1,
              password_reset_token = NULL,
              password_reset_expires = NULL,
              updated_at = NOW()
          WHERE email = $2
            AND password_reset_token = $3
            AND password_reset_expires > NOW()
          RETURNING id
        `,
        [newHash, email, token]
      );
      return result.rows.length > 0;
    },
    async () => {
      const { data, error } = await supabase
        .from(AUTH_TABLE)
        .update({
          password: newHash,
          password_reset_token: null,
          password_reset_expires: null,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)
        .eq("password_reset_token", token)
        .gt("password_reset_expires", new Date().toISOString())
        .select("id");
      if (!error) {
        return (data || []).length > 0;
      }

      if (!String(error.message || "").toLowerCase().includes("column")) {
        throw error;
      }

      const store = await readResetStore();
      const entry = store.items[String(email).toLowerCase()];
      if (!entry) return false;

      const expires = entry.expiresAt ? new Date(entry.expiresAt).getTime() : 0;
      if (entry.token !== token || expires <= Date.now()) {
        return false;
      }

      const updateWithTimestamp = await supabase
        .from(AUTH_TABLE)
        .update({
          password: newHash,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)
        .select("email")
        .maybeSingle();

      let updated = updateWithTimestamp;
      if (
        updateWithTimestamp.error &&
        String(updateWithTimestamp.error.message || "").toLowerCase().includes("column")
      ) {
        updated = await supabase
          .from(AUTH_TABLE)
          .update({ password: newHash })
          .eq("email", email)
          .select("email")
          .maybeSingle();
      }

      if (updated.error) throw updated.error;

      delete store.items[String(email).toLowerCase()];
      await writeResetStore(store.items);

      return Boolean(updated.data);
    },
    async () => {
      const db = await readLocal();
      const now = Date.now();
      const index = db.users.findIndex((u) => {
        const expires = u.password_reset_expires ? new Date(u.password_reset_expires).getTime() : 0;
        return u.email === email && u.password_reset_token === token && expires > now;
      });
      if (index === -1) return false;
      db.users[index].password_hash = newHash;
      db.users[index].password_reset_token = null;
      db.users[index].password_reset_expires = null;
      db.users[index].updated_at = new Date().toISOString();
      await writeLocal(db.users);
      return true;
    }
  );

const listUsers = async () =>
  withFallback(
    async () => {
      const result = await pool.query(
        `
          SELECT id, name, email, role, is_verified, phone, address, avatar, created_at, updated_at
          FROM ${AUTH_TABLE}
          ORDER BY created_at DESC
        `
      );
      return result.rows;
    },
    async () => {
      const { data, error } = await supabase
        .from(AUTH_TABLE)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapRow);
    },
    async () => {
      const db = await readLocal();
      return [...db.users]
        .map(({ password_hash, ...safe }) => safe)
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
  );

const updateUserProfile = async (id, updates) =>
  withFallback(
    async () => {
      const result = await pool.query(
        `
          UPDATE ${AUTH_TABLE}
          SET name = COALESCE($1, name),
              phone = COALESCE($2, phone),
              address = COALESCE($3, address),
              avatar = COALESCE($4, avatar),
              updated_at = NOW()
          WHERE id = $5
          RETURNING id, name, email, role, is_verified, phone, address, avatar
        `,
        [updates.name ?? null, updates.phone ?? null, updates.address ?? null, updates.avatar ?? null, id]
      );
      return result.rows[0] || null;
    },
    async () => {
      const identifierColumn = String(id).includes("@") ? "email" : "id";

      const existing = await supabase
        .from(AUTH_TABLE)
        .select("*")
        .eq(identifierColumn, id)
        .limit(1)
        .maybeSingle();

      if (existing.error) throw existing.error;
      if (!existing.data) return null;

      const row = existing.data;
      const payload = {};

      if (Object.prototype.hasOwnProperty.call(row, "name") && updates.name !== undefined) {
        payload.name = updates.name;
      }
      if (Object.prototype.hasOwnProperty.call(row, "phone") && updates.phone !== undefined) {
        payload.phone = updates.phone;
      }
      if (Object.prototype.hasOwnProperty.call(row, "address") && updates.address !== undefined) {
        payload.address = updates.address;
      }
      if (Object.prototype.hasOwnProperty.call(row, "avatar") && updates.avatar !== undefined) {
        payload.avatar = updates.avatar;
      }
      if (Object.prototype.hasOwnProperty.call(row, "updated_at")) {
        payload.updated_at = new Date().toISOString();
      }

      if (Object.keys(payload).length === 0) {
        return mapRow(row);
      }

      const { data, error } = await supabase
        .from(AUTH_TABLE)
        .update(payload)
        .eq(identifierColumn, id)
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return mapRow(data);
    },
    async () => {
      const db = await readLocal();
      const index = db.users.findIndex((u) => String(u.id) === String(id));
      if (index === -1) return null;

      db.users[index] = {
        ...db.users[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      await writeLocal(db.users);

      const { password_hash, ...safe } = db.users[index];
      return safe;
    }
  );

const deleteUserById = async (id) =>
  withFallback(
    async () => {
      const result = await pool.query(`DELETE FROM ${AUTH_TABLE} WHERE id = $1 RETURNING id`, [id]);
      return result.rows.length > 0;
    },
    async () => {
      const { error, count } = await supabase
        .from(AUTH_TABLE)
        .delete({ count: "exact" })
        .eq("id", id);
      if (error) throw error;
      return Number(count || 0) > 0;
    },
    async () => {
      const db = await readLocal();
      const index = db.users.findIndex((u) => String(u.id) === String(id));
      if (index === -1) return false;
      db.users.splice(index, 1);
      await writeLocal(db.users);
      return true;
    }
  );

module.exports = {
  createUser,
  findByEmail,
  findByEmailAndRole,
  getById,
  setEmailVerification,
  verifyEmail,
  setPasswordReset,
  resetPassword,
  listUsers,
  updateUserProfile,
  deleteUserById,
};
