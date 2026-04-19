"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }) {
  const { auth } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      router.push("/auth/client/login");
    }
    
    if (!auth.loading && auth.user && auth.profile?.role !== "client") {
        router.push("/");
    }
  }, [auth.loading, auth.user, auth.profile, router]);

  if (auth.loading || !auth.user || auth.profile?.role !== "client") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-[radial-gradient(1200px_circle_at_10%_0%,rgba(250,212,192,0.35),transparent_45%),radial-gradient(1000px_circle_at_90%_10%,rgba(217,236,255,0.35),transparent_50%),linear-gradient(180deg,#fff,#f8f4ef)]">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
