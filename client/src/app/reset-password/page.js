"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const email = searchParams.get("email");
      const token = searchParams.get("token");
      
      const { data } = await api.post("/auth/reset-password", {
        email,
        token,
        password,
      });
      setMessage(data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Password reset failed");
    }
  };

  return (
    <form onSubmit={submit} className="form-grid">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        required
      />
      <button className="btn">Update Password</button>
      {message && <p className="status">{message}</p>}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="container simple-center">
      <section className="glass auth-card">
        <h1>Reset Password</h1>
        <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
