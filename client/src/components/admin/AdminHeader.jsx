"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, User, LogOut, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export function AdminHeader() {
  const router = useRouter();
  const { auth, logout } = useApp();
  const userName = auth.profile?.full_name || auth.user?.email?.split("@")[0] || "Admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="rounded-full border border-border/70 bg-white/75 shadow-sm hover:bg-white" />
        <div className="h-4 w-px bg-border md:hidden" />
        <div className="flex items-center gap-2 md:hidden">
          <ShieldCheck className="size-5 text-primary" />
          <span className="font-bold tracking-tight">FurryFinds</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/selling"
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "dash-btn hidden md:inline-flex")}
        >
          New Listing
        </Link>

        <Button variant="ghost" size="icon" className="relative rounded-full border border-border/70 bg-white/75">
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-primary" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            {auth.profile?.profile_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={auth.profile.profile_image}
                alt={userName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="size-5" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{auth.user?.email}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/dashboard")}>Overview</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
