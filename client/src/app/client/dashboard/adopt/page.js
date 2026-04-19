"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, Search, PawPrint, Clock, Heart, Sparkles } from "lucide-react";
import { getAuthHeader } from "@/lib/api";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export default function AdoptPetPage() {
  const { auth } = useApp();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/pets", { params: { available: true } });
        const list = res.data.pets || [];
        const userId = auth.user?.id || auth.user?._id || null;
        
        // Filter out pets listed by the current user
        const storePets = userId
          ? list.filter((pet) => {
              const ownerId = pet.postedBy?._id || pet.postedBy?.id || pet.postedBy;
              return String(ownerId || "") !== String(userId);
            })
          : list;
        
        setPets(storePets);
        if (storePets.length > 0) setSelected(storePets[0]);
      } catch (err) {
        console.error(err);
        toast.error("Unable to load pets.");
      } finally {
        setLoading(false);
      }
    };

    if (!auth.loading) {
      load();
    }
  }, [auth.user, auth.loading]);

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const text = `${pet.name} ${pet.breed} ${pet.category}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesCategory = category === "All" || String(pet.category || "").toLowerCase() === category.toLowerCase();
      return matchesQuery && matchesCategory;
    });
  }, [pets, query, category]);

  const handleBuy = async () => {
    if (!selected) return;
    
    setRequesting(true);
    try {
      const headers = getAuthHeader();
      await api.post("/requests", { 
        petId: selected._id || selected.id, 
        requestType: "purchase" 
      }, { headers });
      
      toast.success(`Purchase request sent for ${selected.name}!`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send purchase request.");
    } finally {
      setRequesting(false);
    }
  };

  return (
      <section className="dash-panel dashboard-hero-panel min-h-[220px] flex items-center">
        <div className="flex flex-wrap items-center justify-between gap-8 w-full">
          <div className="space-y-4 flex-1 min-w-[300px]">
            <p className="kicker">Marketplace</p>
            <h1 className="dash-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight">Adopt & Purchase</h1>
            <p className="max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              Find your perfect companion among our curated pets. Select a soul to learn more about their story and request to bring them home.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="mr-1.5 size-3 text-amber-500" /> Premium Selection
              </Badge>
              <Badge variant="secondary" className="bg-sky/10 text-sky-700 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                {pets.length} Available
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/40 bg-gray-50/50 p-4 backdrop-blur-sm shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <Input
            placeholder="Search by name or breed..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border-border/40 focus:ring-primary/20 h-11 pl-11 rounded-xl shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px] h-11 bg-white border-border/40 rounded-xl shadow-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-xl">
              {["All", "Dogs", "Cats", "Birds", "Fish", "Rabbits", "Others"].map((item) => (
                <SelectItem key={item} value={item} className="rounded-lg">
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="px-4 py-2 bg-white rounded-xl border border-border/40 shadow-sm">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{filteredPets.length} <span className="font-medium">Found</span></p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="grid gap-6 sm:grid-cols-2">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="dash-card h-[280px] animate-pulse bg-muted/20 border-none" />
            ))
          ) : filteredPets.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <PawPrint className="mx-auto mb-4 size-12 text-muted-foreground/30" />
              <h3 className="text-lg font-bold">No pets match your criteria</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">Try adjusting your filters or search query to find more companions.</p>
            </div>
          ) : (
            filteredPets.map((pet) => (
              <Card
                key={pet._id || pet.id}
                className={cn(
                  "dash-card cursor-pointer transition-all duration-300 group hover:shadow-xl hover:shadow-primary/5 border-none",
                  selected?._id === pet._id ? "bg-primary/5 shadow-md ring-2 ring-primary/20" : "bg-white"
                )}
                onClick={() => setSelected(pet)}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl">
                  {pet.images && pet.images.length > 0 ? (
                    <img src={pet.images[0]} alt={pet.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted/30">
                      <PawPrint className="size-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <Badge className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-primary text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
                    {pet.category}
                  </Badge>
                </div>
                <CardHeader className="p-6 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-black tracking-tight">{pet.name}</CardTitle>
                      <CardDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">{pet.breed}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-primary">${pet.price ?? "0"}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-sky-500" /> Age: {pet.age ?? "N/A"}</span>
                    <span className="flex items-center gap-1.5"><Heart size={12} className="text-rose-500" /> Healthy</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card className="dash-card border-none shadow-2xl shadow-black/[0.04] bg-white sticky top-24 overflow-hidden">
            {!selected ? (
              <div className="p-12 text-center space-y-4">
                <div className="size-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto">
                    <PawPrint className="size-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-bold text-lg">Select A Companion</h3>
                <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">Choose a soul from the left to view their detailed story and request adoption.</p>
              </div>
            ) : (
              <>
                <div className="relative aspect-video">
                    {selected.images?.[0] ? (
                        <img src={selected.images[0]} alt="" className="size-full object-cover" />
                    ) : (
                        <div className="size-full bg-primary-alt/5 flex items-center justify-center">
                            <PawPrint className="size-12 text-primary/20" />
                        </div>
                    )}
                    <Badge className="absolute top-5 left-5 bg-black/40 backdrop-blur-md text-white border-none py-1.5 px-3 text-[10px] font-black uppercase tracking-[0.2em]">
                        Detailed Profile
                    </Badge>
                </div>
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-3xl font-black tracking-tighter text-foreground">{selected.name}</h2>
                      <p className="text-sm font-bold text-primary/80 uppercase tracking-widest mt-1">{selected.breed || "Soul Buddy"}</p>
                    </div>
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Heart className="size-6 text-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: "Category", value: selected.category, sub: "Species", icon: PawPrint, color: "text-blue-500", bg: "bg-blue-50" },
                        { label: "Price", value: `$${selected.price ?? 0}`, sub: "Adoption Fee", icon: ShoppingCart, color: "text-green-500", bg: "bg-green-50" }
                    ].map((feat, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{feat.label}</p>
                            <p className="text-base font-black text-foreground">{feat.value}</p>
                        </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                     <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">About {selected.name}</p>
                     <p className="text-sm text-muted-foreground leading-relaxed italic bg-gray-50/50 p-4 rounded-2xl border border-dashed border-border/60">
                       &quot;{selected.description || "No description provided. This little soul is waiting for someone like you!"}&quot;
                     </p>
                  </div>

                  <Button 
                    onClick={handleBuy} 
                    className="btn btn-peach w-full py-8 text-base font-black shadow-xl shadow-orange-500/20"
                    disabled={requesting}
                  >
                    {requesting ? "Sending Request..." : "Request Adoption"}
                  </Button>
                  
                  <p className="text-[10px] text-center font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Secure transaction via FurryFinds Guard
                  </p>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
