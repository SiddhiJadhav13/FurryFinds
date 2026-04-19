"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/client/dashboard") || pathname?.startsWith("/admin");

  return (
    <>
      {!isDashboard && <Navbar />}
      {children}
    </>
  );
}
