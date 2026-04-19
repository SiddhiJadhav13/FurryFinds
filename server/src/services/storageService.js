const fs = require("fs/promises");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.CLIENT_SUPABASE_URL || process.env.SUPABASE_DATABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SECRET_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const BUCKET = process.env.SUPABASE_PET_BUCKET || "pet-images";

let supabase = null;
try {
  if (SUPABASE_URL && SUPABASE_KEY && /^https?:\/\//i.test(String(SUPABASE_URL))) {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } else if (SUPABASE_URL || SUPABASE_KEY) {
    // env present but invalid
    // eslint-disable-next-line no-console
    console.warn("Supabase config present but invalid. SUPABASE_URL or SUPABASE_KEY may be misconfigured.");
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn("Failed to initialize Supabase client:", err?.message || err);
  supabase = null;
}

const uploadFiles = async (files, opts = {}) => {
  if (!supabase) {
    // Supabase not configured, return local urls as fallback
    return files.map((f) => `/uploads/${f.filename}`);
  }

  const uploaded = [];

  for (const file of files) {
    const ext = path.extname(file.originalname) || "";
    const destName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const destPath = destName;

    try {
      const buffer = await fs.readFile(file.path);

      const { data, error } = await supabase.storage.from(BUCKET).upload(destPath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.mimetype,
      });

      if (error) {
        // on error, skip to next
        // eslint-disable-next-line no-console
        console.error("Supabase upload error:", error.message || error);
        continue;
      }

      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      const publicUrl = publicData?.publicUrl || `/uploads/${file.filename}`;

      uploaded.push(publicUrl);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Storage upload failed:", err.message || err);
    } finally {
      try {
        await fs.unlink(file.path);
      } catch {
        // ignore
      }
    }
  }

  return uploaded;
};

module.exports = { uploadFiles };
