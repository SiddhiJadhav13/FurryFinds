"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  PawPrint,
  ShoppingCart,
  Sparkles,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { api, getAuthHeader } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export default function ClientDashboardPage() {
  const { auth } = useApp();
  const [loading, setLoading] = useState(true);
  const [storePets, setStorePets] = useState([]);
  const [myPets, setMyPets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const headers = getAuthHeader();
        const userId = auth.user?.id || auth.user?._id;
        const [petsResult, requestsResult, statsResult] = await Promise.allSettled([
          api.get("/pets", { headers }),
          api.get("/requests/my", { headers }),
          api.get("/users/stats", { headers }),
        ]);

        if (petsResult.status === "fulfilled") {
          const allPets = petsResult.value.data.pets || [];
          const mine = userId
            ? allPets.filter((pet) => {
                const ownerId = pet.postedBy?._id || pet.postedBy?.id || pet.postedBy;
                return String(ownerId || "") === String(userId);
              })
            : [];
          const store = userId
            ? allPets.filter((pet) => {
                const ownerId = pet.postedBy?._id || pet.postedBy?.id || pet.postedBy;
                return String(ownerId || "") !== String(userId);
              })
            : allPets;
          setMyPets(mine);
          setStorePets(store);
        } else {
          setMyPets([]);
          setStorePets([]);
        }

        if (requestsResult.status === "fulfilled") {
          setRequests(requestsResult.value.data.requests || []);
        } else {
          setRequests([]);
        }

        if (statsResult.status === "fulfilled") {
          setStats(statsResult.value.data.stats || {});
        } else {
          setStats({});
        }
      } catch (error) {
        console.error("Dashboard error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (!auth.loading && auth.user) {
      loadData();
    }
  }, [auth.user, auth.loading]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const totalRequests = stats.total_requests ?? requests.length;
  const featuredPets = storePets.slice(0, 4);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto">
      <section className="dash-panel dashboard-hero-panel min-h-[220px] flex items-center">
        <div className="flex flex-wrap items-center justify-between gap-8 w-full">
          <div className="space-y-4 flex-1 min-w-[300px]">
            <p className="kicker">Marketplace</p>
            <h1 className="dash-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight">Adopt & Purchase Pets</h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              Browse pets curated by the admin team and send purchase requests directly from your dashboard.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="mr-1.5 size-3 text-amber-500" /> Live Summary
              </Badge>
              <Badge variant="secondary" className="bg-green-100/80 text-green-700 hover:bg-green-100 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                <BadgeCheck className="mr-1 size-3" /> {approvedCount} Approved
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/client/dashboard/adopt"
              className={cn("btn btn-peach text-sm px-8 shadow-lg shadow-orange-500/10")}
            >
              Browse Store
            </Link>
            <Link
              href="/client/dashboard/pets"
              className={cn("btn btn-sky text-sm px-8 shadow-lg shadow-blue-500/10")}
            >
              My Pets
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Pets In Store", value: storePets.length, sub: "Ready for purchase", icon: PawPrint, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Your Listings", value: myPets.length, sub: "Listed by you", icon: Tag, color: "text-purple-500", bg: "bg-purple-50" },
          { title: "Purchase Requests", value: totalRequests, sub: `${approvedCount} approved`, icon: BadgeCheck, color: "text-green-500", bg: "bg-green-50" },
        ].map((item, idx) => (
          <Card key={idx} className="dash-card dashboard-metric relative overflow-hidden group border-none shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-6 px-6">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground whitespace-nowrap">
                {item.title}
              </CardTitle>
              <div className={cn("p-2 rounded-xl transition-colors shrink-0", item.bg)}>
                <item.icon className={cn("size-4", item.color)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground">{item.value}</div>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground/80">{item.sub}</p>
                <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                   <div 
                     className={cn("h-full rounded-full transition-all duration-1000", item.color.replace('text-', 'bg-'))}
                     style={{ width: `${Math.min(100, item.value * 10)}%` }}
                   />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Card className="dash-card border-none shadow-xl shadow-black/[0.02] bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6 px-8 py-7">
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Featured Pets</CardTitle>
              <CardDescription className="text-xs mt-1 font-medium">Hand-picked listings from the store.</CardDescription>
            </div>
            <Link
              href="/client/dashboard/adopt"
              className={cn("btn btn-mini px-5 py-2 text-[10px] font-bold uppercase tracking-widest")}
            >
              View Store
            </Link>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-4">
              {featuredPets.map((pet) => (
                <div key={pet._id || pet.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-transparent hover:border-border/60 hover:shadow-sm transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-primary-alt/10 flex items-center justify-center overflow-hidden border border-primary-alt/5 group-hover:scale-105 transition-transform">
                      {pet.images?.[0] ? (
                        <img src={pet.images[0]} alt="" className="size-full object-cover" />
                      ) : (
                        <PawPrint className="size-6 text-primary/30" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-base text-foreground">{pet.name}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{pet.breed || "Social Buddy"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-base font-black text-primary">${pet.price || 0}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest">
                       Store
                    </Badge>
                  </div>
                </div>
              ))}
              {featuredPets.length === 0 && (
                <div className="text-center py-12">
                   <PawPrint className="mx-auto mb-4 size-10 text-muted-foreground/20" />
                   <p className="text-sm font-bold text-muted-foreground">No pets available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="dash-card border-none shadow-xl shadow-black/[0.02] bg-white/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 pb-6 px-8 py-7">
            <CardTitle className="text-xl font-bold tracking-tight">Recent Requests</CardTitle>
            <CardDescription className="text-xs mt-1 font-medium">Track your latest purchase activity.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-4">
              {requests.slice(0, 4).map((request) => (
                <div key={request._id || request.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-transparent hover:border-border/60 hover:shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100/50">
                      <BadgeCheck className="size-4.5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Request {request.requestType || "purchase"}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wide">
                        Pet: <span className="text-primary">{request.pet?.name || "Buddy"}</span>
                      </p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                    request.status === "approved" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                  )}>
                    {request.status || "pending"}
                  </Badge>
                </div>
              ))}
              {requests.length === 0 && (
                <div className="text-center py-12">
                   <BadgeCheck className="mx-auto mb-4 size-10 text-muted-foreground/20" />
                   <p className="text-sm font-bold text-muted-foreground">No requests found</p>
                </div>
              )}
            </div>
            <Link
              href="/client/dashboard/adopt"
              className={cn("btn btn-sky mt-8 w-full py-6 text-sm font-bold shadow-lg shadow-blue-500/10")}
            >
              View Store to Start
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
