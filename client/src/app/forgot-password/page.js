"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <main className="container simple-center">
      <section className="glass auth-card">
        <h1>Forgot Password</h1>
        <form onSubmit={submit} className="form-grid">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          <button className="btn">Send reset link</button>
        </form>
        {message && <p className="status">{message}</p>}
      </section>
    </main>
  );
}
