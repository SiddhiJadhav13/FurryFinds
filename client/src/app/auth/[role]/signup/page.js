"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";

export default function RoleSignupPage() {
  const params = useParams();
  const router = useRouter();
  const role = params.role === "admin" ? "admin" : "client";
  const { refreshProfile, loginLegacy } = useApp();

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
      const { data } = await api.post(`/auth/${role}/signup`, form);

      if (data.token) {
        await loginLegacy(data.token, data.user);
        await refreshProfile();
        router.push(role === "admin" ? "/admin/dashboard" : "/client/dashboard");
        return;
      }

      setMessage(data.message || "Account created successfully. You can now log in.");
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Signup failed");
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
