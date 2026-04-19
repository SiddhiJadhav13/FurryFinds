"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";

export default function RoleLoginPage() {
  const params = useParams();
  const router = useRouter();
  const { refreshProfile, loginLegacy } = useApp();
  const role = params.role === "admin" ? "admin" : "client";

  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data } = await api.post(`/auth/${role}/login`, form);
      
      if (!data.token) {
        throw new Error("Invalid response from server");
      }

      await loginLegacy(data.token, data.user);
      
      const profileRole = String(data.user?.role || "client").toLowerCase();
      if (profileRole !== role) {
        throw new Error(`This account is registered as ${profileRole}. Please use the ${profileRole} login.`);
      }

      await refreshProfile();
      router.push(profileRole === "admin" ? "/admin/dashboard" : "/client/dashboard");
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container auth-page">
      <section className="auth-card glass">
        <h1>{role === "admin" ? "Admin Login" : "Client Login"}</h1>
        <p>Welcome back to FurryFinds.</p>
        <form onSubmit={handleSubmit} className="form-grid">
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
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        {message && <p className="status">{message}</p>}
        <div className="row gap-sm wrap">
          <Link href={`/auth/${role}/signup`}>Create account</Link>
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
      </section>
    </main>
  );
}
