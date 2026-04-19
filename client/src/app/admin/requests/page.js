"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, getAuthHeader } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const sampleRequests = [
  {
    id: "sample-1",
    status: "pending",
    requestType: "purchase",
    pet: { name: "Milo" },
    client: { name: "Ava Patel" },
    isSample: true,
  },
  {
    id: "sample-2",
    status: "approved",
    requestType: "adopt",
    pet: { name: "Luna" },
    client: { name: "Noah Reed" },
    isSample: true,
  },
  {
    id: "sample-3",
    status: "rejected",
    requestType: "purchase",
    pet: { name: "Kiwi" },
    client: { name: "Jia Park" },
    isSample: true,
  },
];

export default function AdminRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const loadRequests = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const headers = getAuthHeader();
      const res = await api.get("/requests", { headers });
      setRequests(res.data.requests || []);
    } catch (error) {
      console.error(error);
      toast.error("Unable to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Initial load
    const init = async () => {
      try {
        const headers = getAuthHeader();
        const res = await api.get("/requests", { headers });
        if (mounted) setRequests(res.data.requests || []);
      } catch (error) {
        console.error(error);
        if (mounted) toast.error("Unable to load requests");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => { mounted = false; };
  }, []);

  const useSamples = !loading && requests.length === 0;
  const displayRequests = useSamples ? sampleRequests : requests;

  const metrics = useMemo(() => {
    const base = useSamples ? sampleRequests : requests;
    return {
      total: base.length,
      pending: base.filter((item) => item.status === "pending").length,
      approved: base.filter((item) => item.status === "approved").length,
    };
  }, [requests, useSamples]);

  const updateStatus = async (id, status) => {
    try {
      const headers = getAuthHeader();
      await api.patch(`/requests/${id}/status`, { status }, { headers });
      toast.success("Request updated");
      loadRequests();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update request");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto">
      <section className="dash-panel dashboard-hero-panel min-h-[220px] flex items-center">
        <div className="flex flex-wrap items-center justify-between gap-8 w-full">
          <div className="space-y-4 flex-1 min-w-[300px]">
            <p className="kicker">Workflow Center</p>
            <h1 className="dash-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight">Purchase Requests</h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              Approve or reject client requests in real time. Manage the lifecycle of each transaction from pending to completion.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                <Clock3 className="mr-1.5 size-3 text-sky-600" /> Active Queue
              </Badge>
              {useSamples && (
                <Badge variant="secondary" className="bg-amber-100/80 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  Sample Data
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Total Requests", value: metrics.total, sub: "All time total", icon: Clock3, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Pending", value: metrics.pending, sub: "Awaiting decision", icon: Clock3, color: "text-amber-500", bg: "bg-amber-50" },
          { title: "Approved", value: metrics.approved, sub: "Successfully vetted", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
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

      <Card className="dash-card border-none shadow-xl shadow-black/[0.02] bg-white/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-6 px-8 py-7">
          <CardTitle className="text-xl font-bold tracking-tight">Incoming Requests</CardTitle>
          <CardDescription className="text-xs mt-1 font-medium">Review each request and move it to approved or rejected.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {displayRequests.map((request) => (
              <div
                key={request._id || request.id}
                className="flex flex-wrap items-center justify-between p-6 gap-6 hover:bg-white/80 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="size-11 rounded-full bg-sky/10 flex items-center justify-center border border-sky-100/50">
                    <Clock3 className="size-4.5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-bold text-base text-foreground">
                      {request.client?.name || "Client"}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 uppercase tracking-wide">
                      Interested In <span className="text-primary font-bold">{request.pet?.name || "Pet"}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 ml-auto">
                  <Badge className={cn(
                    "rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest mr-4",
                    request.status === "approved" ? "bg-green-100 text-green-700" : 
                    request.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {request.status || "pending"}
                  </Badge>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-border/60 text-[11px] font-bold uppercase transition-all hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                      disabled={Boolean(request.isSample)}
                      onClick={() => updateStatus(request._id || request.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-border/60 text-[11px] font-bold uppercase transition-all hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                      disabled={Boolean(request.isSample)}
                      onClick={() => updateStatus(request._id || request.id, "rejected")}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="rounded-xl bg-slate-900 text-white text-[11px] font-bold uppercase transition-all hover:bg-slate-800 shadow-md"
                      disabled={Boolean(request.isSample)}
                      onClick={() => updateStatus(request._id || request.id, "completed")}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {displayRequests.length === 0 && (
              <div className="p-12 text-center">
                <div className="inline-flex size-12 rounded-full bg-muted/20 items-center justify-center mb-4">
                  <Clock3 className="size-6 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-bold">No requests found</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                  Once clients start interacting with your listings, their purchase requests will appear here.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>

  );
}
