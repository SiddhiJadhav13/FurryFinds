"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, getAuthHeader } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PawPrint, Sparkles } from "lucide-react";
import PetsTable from "@/components/pets/PetsTable";

const sampleListings = [
  {
    id: "sample-1",
    name: "Milo",
    breed: "Golden Retriever",
    price: 850,
    category: "Dogs",
  },
  {
    id: "sample-2",
    name: "Luna",
    breed: "Persian Cat",
    price: 620,
    category: "Cats",
  },
  {
    id: "sample-3",
    name: "Kiwi",
    breed: "Parrot",
    price: 300,
    category: "Birds",
  },
];

export default function AdminSellingPage() {
  const [hasPets, setHasPets] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPets = async () => {
      setChecking(true);
      try {
        const headers = getAuthHeader();
        const res = await api.get("/pets", { headers });
        const list = res.data.pets || [];
        setHasPets(list.length > 0);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load listings");
      } finally {
        setChecking(false);
      }
    };

    checkPets();
  }, []);

  const showSample = !checking && !hasPets;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="dash-panel dashboard-hero-panel">
        <div className="flex flex-wrap items-center justify-between gap-8">
          <div className="space-y-4">
            <p className="kicker">Inventory Management</p>
            <h1 className="dash-title text-3xl md:text-5xl tracking-tight">Pet Listings</h1>
            <p className="max-w-2xl text-base text-muted-foreground leading-relaxed">
              Create, edit, and curate every pet that appears in the marketplace. Monitor your inventory levels and stock status.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold">
                <Sparkles className="mr-1.5 size-3.5 text-amber-500" /> Admin Inventory
              </Badge>
              {showSample && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-3 py-1">
                  Sample Data Active
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {showSample && (
        <section className="grid gap-6 md:grid-cols-3">
          {sampleListings.map((pet, idx) => (
            <Card key={pet.id} className="dash-card group hover:border-primary/20 transition-all">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">{pet.name}</CardTitle>
                  <div className={cn("p-1.5 rounded-lg bg-primary-alt/10")}>
                    <PawPrint className="size-3.5 text-primary" />
                  </div>
                </div>
                <CardDescription className="text-xs font-medium uppercase tracking-wider">{pet.breed}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm pt-2">
                <span className="text-muted-foreground font-medium">{pet.category}</span>
                <span className="text-primary font-extrabold text-base">${pet.price}</span>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="dash-panel border-none shadow-xl shadow-black/[0.02] p-0 overflow-hidden">
        <div className="px-8 py-7 border-b border-border/40">
          <h2 className="text-xl font-bold">Listing Directory</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and filter your active marketplace entries.</p>
        </div>
        <div className="p-8">
          <PetsTable showAll />
        </div>
      </section>
    </div>
  );
}
