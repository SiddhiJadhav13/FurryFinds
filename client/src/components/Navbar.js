"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Moon, PawPrint, Save, Sun, UserRound } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function Navbar() {
  const { theme, setTheme, auth, logout, refreshProfile } = useApp();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const panelRef = useRef(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    gender: "",
    dob: "",
    profile_image: "",
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!panelRef.current || panelRef.current.contains(event.target)) {
        return;
      }

      setOpen(false);
      setMessage("");
    };

    if (open) {
      window.addEventListener("pointerdown", onPointerDown);
    }

    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const saveProfile = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          ...form,
          email: auth.user?.email || "",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not save profile");
      }

      await refreshProfile();
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(error.message || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="topbar">
      <div className="container row between center topbar-inner">
        <Link href="/" className="brand brand-with-icon">
          <span className="brand-paw" aria-hidden>
            <PawPrint size={15} />
          </span>
          <span>FurryFinds</span>
        </Link>

        <div className="row center topbar-actions gap-sm" ref={panelRef}>
          <button
            className="icon-btn"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {!mounted || theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {auth.user && (
            <>
              <button
                className="icon-btn profile-btn"
                aria-label="Open account profile"
                onClick={() => {
                  if (!open) {
                    setForm({
                      full_name: auth.profile?.full_name || "",
                      phone: auth.profile?.phone || "",
                      address: auth.profile?.address || "",
                      gender: auth.profile?.gender || "",
                      dob: auth.profile?.dob || "",
                      profile_image: auth.profile?.profile_image || "",
                    });
                  }
                  setOpen((prev) => !prev);
                  setMessage("");
                }}
              >
                <UserRound size={18} />
              </button>

              {open && (
                <section className="account-panel glass" role="dialog" aria-label="Profile panel">
                  <div className="account-head">
                    <div className="account-avatar">
                      {form.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.profile_image} alt="Profile" />
                      ) : (
                        <PawPrint size={18} />
                      )}
                    </div>
                    <div>
                      <h3>{auth.profile?.full_name || auth.user.email?.split("@")[0] || "User"}</h3>
                      <p>{auth.user.email}</p>
                    </div>
                  </div>

                  <div className="account-grid">
                    <input
                      placeholder="Full Name"
                      value={form.full_name}
                      onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                    />
                    <input value={auth.user.email || ""} disabled placeholder="Email" />
                    <input
                      placeholder="Phone Number"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    />
                    <input
                      placeholder="Address"
                      value={form.address}
                      onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    />
                    <input
                      placeholder="Gender"
                      value={form.gender}
                      onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                    />
                    <input
                      type="date"
                      placeholder="Date of Birth"
                      value={form.dob || ""}
                      onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
                    />
                    <input
                      placeholder="Profile Photo URL"
                      value={form.profile_image}
                      onChange={(e) => setForm((p) => ({ ...p, profile_image: e.target.value }))}
                    />
                    <input value={auth.profile?.role || "client"} disabled placeholder="Role" />
                    <input
                      value={
                        auth.profile?.created_at
                          ? new Date(auth.profile.created_at).toLocaleDateString()
                          : ""
                      }
                      disabled
                      placeholder="Join Date"
                    />
                  </div>

                  <div className="row gap-sm wrap account-actions">
                    <button
                      className="btn btn-mint account-save-btn"
                      type="button"
                      onClick={saveProfile}
                      disabled={saving}
                    >
                      <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button className="ghost account-logout-btn" type="button" onClick={logout} disabled={saving}>
                      Logout
                    </button>
                  </div>

                  {message && <p className="account-message">{message}</p>}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
