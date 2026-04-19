"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

export default function RoleSignupPage() {
  const params = useParams();
  const role = params.role === "admin" ? "admin" : "client";
  const { supabase, refreshProfile } = useApp();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            role,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session?.access_token) {
        await refreshProfile();
      }

      setMessage("Account created successfully. You can now log in.");
    } catch (error) {
      setMessage(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container auth-page">
      <section className="auth-card glass">
        <h1>{role === "admin" ? "Admin Signup" : "Client Signup"}</h1>
        <p>Build your account and verify your email to continue.</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        {message && <p className="status">{message}</p>}
        <div className="row gap-sm wrap">
          <Link href={`/auth/${role}/login`}>Already have an account?</Link>
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
      </section>
    </main>
  );
}
