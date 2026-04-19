"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useApp } from "@/context/AppContext";

export default function AdminLayout({ children }) {
  const { auth } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      router.push("/auth/admin/login");
    }

    if (!auth.loading && auth.user && auth.profile?.role !== "admin") {
      router.push("/");
    }
  }, [auth.loading, auth.user, auth.profile, router]);

  if (auth.loading || !auth.user || auth.profile?.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="min-h-svh bg-[radial-gradient(1200px_circle_at_12%_0%,rgba(255,220,204,0.35),transparent_45%),radial-gradient(900px_circle_at_92%_12%,rgba(214,233,255,0.35),transparent_50%),linear-gradient(180deg,#fff,#f8f4ef)]">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
