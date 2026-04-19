"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ClipboardList, PawPrint, Sparkles, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { api, getAuthHeader } from "@/lib/api";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { toast } from "sonner";

const samplePets = [
  {
    id: "sample-1",
    name: "Milo",
    breed: "Golden Retriever",
    price: 850,
    isAvailable: true,
    isSample: true,
  },
  {
    id: "sample-2",
    name: "Luna",
    breed: "Persian Cat",
    price: 620,
    isAvailable: true,
    isSample: true,
  },
  {
    id: "sample-3",
    name: "Kiwi",
    breed: "Parrot",
    price: 300,
    isAvailable: false,
    isSample: true,
  },
];

const sampleRequests = [
  {
    id: "req-1",
    status: "pending",
    requestType: "purchase",
    pet: { name: "Milo" },
    client: { name: "Ava Patel" },
    isSample: true,
  },
  {
    id: "req-2",
    status: "approved",
    requestType: "adopt",
    pet: { name: "Luna" },
    client: { name: "Noah Reed" },
    isSample: true,
  },
];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const headers = getAuthHeader();
        const [petsResult, requestsResult, usersResult] = await Promise.allSettled([
          api.get("/pets", { headers }),
          api.get("/requests", { headers }),
          api.get("/admin/users", { headers }),
        ]);

        if (petsResult.status === "fulfilled") {
          setPets(petsResult.value.data.pets || []);
        } else {
          setPets([]);
        }

        if (requestsResult.status === "fulfilled") {
          setRequests(requestsResult.value.data.requests || []);
        } else {
          setRequests([]);
        }

        if (usersResult.status === "fulfilled") {
          setUsers(usersResult.value.data.users || []);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error(error);
        toast.error("Unable to load admin data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[380px] w-full rounded-xl" />
          <Skeleton className="h-[380px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const useSamples = pets.length === 0 && requests.length === 0 && users.length === 0;
  const displayPets = useSamples ? samplePets : pets.slice(0, 3);
  const displayRequests = useSamples ? sampleRequests : requests.slice(0, 4);

  const totalPets = useSamples ? 36 : pets.length;
  const activePets = useSamples ? 28 : pets.filter((pet) => pet.isAvailable).length;
  const totalUsers = useSamples ? 124 : users.length;
  const pendingRequests = useSamples
    ? 6
    : requests.filter((request) => request.status === "pending").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto">
      <section className="dash-panel dashboard-hero-panel min-h-[220px] flex items-center">
        <div className="flex flex-wrap items-center justify-between gap-8 w-full">
          <div className="space-y-4 flex-1 min-w-[300px]">
            <p className="kicker">Admin Command Center</p>
            <h1 className="dash-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight">Marketplace Overview</h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              Monitor listings, manage purchase requests, and oversee platform growth with real-time insights.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="mr-1.5 size-3 text-amber-500" /> Live Operations
              </Badge>
              {useSamples && (
                <Badge variant="secondary" className="bg-amber-100/80 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  Sample Data
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/selling"
              className={cn("btn btn-peach text-sm px-8 shadow-lg shadow-orange-500/10")}
            >
              Add Listing
            </Link>
            <Link
              href="/admin/requests"
              className={cn("btn btn-sky text-sm px-8 shadow-lg shadow-blue-500/10")}
            >
              Review Requests
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Listings", value: totalPets, sub: "Active pets", icon: PawPrint, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Active Listings", value: activePets, sub: "Ready for sale", icon: BadgeCheck, color: "text-green-500", bg: "bg-green-50" },
          { title: "Pending Requests", value: pendingRequests, sub: "Needs review", icon: ClipboardList, color: "text-amber-500", bg: "bg-amber-50" },
          { title: "Registered Users", value: totalUsers, sub: "Platform users", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
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
                     style={{ width: `${Math.min(100, item.value * (idx === 2 ? 15 : 2))}%` }}
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
              <CardTitle className="text-xl font-bold tracking-tight">Latest Listings</CardTitle>
              <CardDescription className="text-xs mt-1 font-medium">Recently added pets for sale.</CardDescription>
            </div>
            <Link
              href="/admin/selling"
              className={cn("btn btn-mini px-5 py-2 text-[10px] font-bold uppercase tracking-widest")}
            >
              Manage
            </Link>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-4">
              {displayPets.map((pet) => (
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
                      <p className="text-xs font-semibold text-muted-foreground">{pet.breed || "Unknown Breed"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-base font-black text-primary">${pet.price || 0}</p>
                    </div>
                    <Badge className={cn(
                      "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                      pet.isAvailable ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-100"
                    )}>
                      {pet.isAvailable ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="dash-card border-none shadow-xl shadow-black/[0.02] bg-white/50 backdrop-blur-sm">
          <CardHeader className="border-b border-border/40 pb-6 px-8 py-7">
            <CardTitle className="text-xl font-bold tracking-tight">Recent Requests</CardTitle>
            <CardDescription className="text-xs mt-1 font-medium">Activity from potential adopters.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-4">
              {displayRequests.map((request) => (
                <div key={request._id || request.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-transparent hover:border-border/60 hover:shadow-sm transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100/50">
                      <Users className="size-4.5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {request.client?.name || "Client"}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                        Interested in <span className="text-primary">{request.pet?.name || "Pet"}</span>
                      </p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                    request.status === "approved" ? "bg-green-100 text-green-700 hover:bg-green-100" : 
                    request.status === "rejected" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                    "bg-amber-100 text-amber-700 hover:bg-amber-100"
                  )}>
                    {request.status || "pending"}
                  </Badge>
                </div>
              ))}
            </div>
            <Link
              href="/admin/requests"
              className={cn("btn btn-sky mt-8 w-full py-6 text-sm font-bold shadow-lg shadow-blue-500/10")}
            >
              Review All Requests
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
