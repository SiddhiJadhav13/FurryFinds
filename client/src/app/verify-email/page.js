"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      try {
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        const { data } = await api.post("/auth/verify-email", { token, email });
        setMessage(data.message);
      } catch (error) {
        setMessage(error.response?.data?.message || "Verification failed");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <main className="container simple-center">
      <section className="glass auth-card">
        <h1>Email Verification</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
