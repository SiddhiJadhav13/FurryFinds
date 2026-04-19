"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/reset-password", {
        email: searchParams.get("email"),
        token: searchParams.get("token"),
        password,
      });
      setMessage(data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Password reset failed");
    }
  };

  return (
    <main className="container simple-center">
      <section className="glass auth-card">
        <h1>Reset Password</h1>
        <form onSubmit={submit} className="form-grid">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            required
          />
          <button className="btn">Update Password</button>
        </form>
        {message && <p className="status">{message}</p>}
      </section>
    </main>
  );
}
