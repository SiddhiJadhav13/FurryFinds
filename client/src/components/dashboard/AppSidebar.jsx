"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  PawPrint,
  Settings,
  ShieldQuestion,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { useApp } from "@/context/AppContext";
import { useSidebar } from "@/components/ui/sidebar";

const items = [
  {
    title: "Dashboard",
    url: "/client/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Pets",
    url: "/client/dashboard/pets",
    icon: PawPrint,
  },
  {
    title: "Adopt Pet",
    url: "/client/dashboard/adopt",
    icon: ShoppingCart,
  },
  {
    title: "Profile & Support",
    url: "/client/dashboard/profile",
    icon: ShieldQuestion,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { logout, auth } = useApp();
  const { state: sidebarState } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="dashboard-sidebar-shell">
      <SidebarHeader className="border-b border-border/70 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <PawPrint className="size-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-lg">FurryFinds</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Client Panel</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname === item.url || pathname?.startsWith(item.url + "/");
                const shouldShowTooltip = sidebarState === "collapsed";

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={shouldShowTooltip ? item.title : undefined}
                      isActive={isActive}
                      className="rounded-lg"
                      render={<Link href={item.url} />}
                    >
                      <item.icon className="size-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/70 p-2">
        <SidebarMenu>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-muted/40 ring-1 ring-border/60">
              {auth.profile?.profile_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={auth.profile.profile_image} alt={auth.profile.full_name || "User"} className="w-full h-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">{auth.user?.email?.[0]?.toUpperCase() || "U"}</div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{auth.profile?.full_name || auth.user?.email || "User"}</div>
              <div className="text-xs text-muted-foreground">{auth.profile?.role || "client"}</div>
            </div>
          </div>

          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/client/dashboard/profile" />}
              tooltip={sidebarState === "collapsed" ? "Profile" : undefined}
            >
              <Settings className="size-5" />
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
              tooltip={sidebarState === "collapsed" ? "Logout" : undefined}
            >
              <LogOut className="size-5" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
