"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash, Edit, Eye } from "lucide-react";
import { toast } from "sonner";

import { api, getAuthHeader } from "@/lib/api";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PetForm from "./PetForm";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const PET_CATEGORIES = ["All", "Dogs", "Cats", "Birds", "Fish", "Rabbits", "Others"];

export default function PetsTable({ showAll = false }) {
  const { auth } = useApp();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [adding, setAdding] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [viewingPet, setViewingPet] = useState(null);

  useEffect(() => {
    if (auth.loading) return;

    let cancelled = false;

    const loadPets = async () => {
      setLoading(true);
      try {
        const res = await api.get("/pets", { headers: getAuthHeader() });
        if (cancelled) return;

        const list = res.data.pets || [];
        const userId = auth.user?.id || auth.user?._id;
        const mine = userId ? list.filter((pet) => String(pet.postedBy) === String(userId)) : list;
        setPets(showAll ? list : mine);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          toast.error("Unable to load pets");
          setPets([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      void loadPets();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [auth.loading, auth.user, showAll]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this pet?")) return;

    try {
      await api.delete(`/pets/${id}`, { headers: getAuthHeader() });
      setPets((prev) => prev.filter((pet) => String(pet._id || pet.id) !== String(id)));
      toast.success("Pet deleted");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const filteredPets = useMemo(
    () =>
      pets.filter((pet) => {
        const queryText = [pet.name, pet.breed, pet.category].join(" ").toLowerCase();
        const matchesQuery = queryText.includes(query.toLowerCase());
        const matchesCategory =
          category === "All" || String(pet.category || "").toLowerCase() === category.toLowerCase();
        return matchesQuery && matchesCategory;
      }),
    [pets, query, category]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pet Directory</h2>
          <p className="text-xs text-muted-foreground">Keep profiles updated for event eligibility.</p>
        </div>
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogTrigger className={cn(buttonVariants({ variant: "default", size: "default" }))}>
            Add Pet
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Pet</DialogTitle>
            </DialogHeader>
            <PetForm
              key="pet-create"
              onSaved={(pet) => {
                setPets((prev) => [pet, ...prev]);
                setAdding(false);
                toast.success("Pet added");
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/40 bg-gray-50/50 p-4 backdrop-blur-sm">
        <div className="relative flex-1 min-w-[280px]">
          <Input
            placeholder="Search by name or breed..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-white border-border/40 focus:ring-primary/20 h-11 pl-4 rounded-xl shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px] h-11 bg-white border-border/40 rounded-xl shadow-sm">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-xl">
              {PET_CATEGORIES.map((item) => (
                <SelectItem key={item} value={item} className="rounded-lg">
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="px-4 py-2 bg-white rounded-xl border border-border/40 shadow-sm">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{filteredPets.length} <span className="font-medium">Total</span></p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/30 bg-white shadow-2xl shadow-black/[0.03] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Breed</TableHead>
              <TableHead>Age</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>Loading pets...</TableCell>
              </TableRow>
            ) : filteredPets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>No pets yet - add your first pet.</TableCell>
              </TableRow>
            ) : (
              filteredPets.map((pet) => {
                const petId = pet._id || pet.id;
                return (
                  <TableRow key={petId}>
                    <TableCell>
                      {pet.images && pet.images.length > 0 ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pet.images[0]} alt={pet.name} className="h-12 w-12 rounded-md object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-muted/50" />
                      )}
                    </TableCell>
                    <TableCell>{pet.name}</TableCell>
                    <TableCell>{pet.breed || "-"}</TableCell>
                    <TableCell>{String(pet.age || "-")}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewingPet(pet)}>
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditingPet(pet)}>
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(petId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(editingPet)} onOpenChange={(open) => !open && setEditingPet(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pet</DialogTitle>
          </DialogHeader>
          {editingPet && (
            <PetForm
              key={`pet-edit-${editingPet._id || editingPet.id}`}
              pet={editingPet}
              onSaved={(updatedPet) => {
                const updatedId = updatedPet._id || updatedPet.id;
                setPets((prev) =>
                  prev.map((pet) => (String(pet._id || pet.id) === String(updatedId) ? updatedPet : pet))
                );
                setEditingPet(null);
                toast.success("Pet updated");
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewingPet)} onOpenChange={(open) => !open && setViewingPet(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingPet?.name}</DialogTitle>
          </DialogHeader>
          {viewingPet && (
            <div className="grid gap-4 text-sm text-muted-foreground">
              <div className="grid gap-2 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide">Breed</p>
                  <p className="text-foreground">{viewingPet.breed || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide">Age</p>
                  <p className="text-foreground">{viewingPet.age || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide">Category</p>
                  <p className="text-foreground">{viewingPet.category || "-"}</p>
                </div>
              </div>
              <p>{viewingPet.description || "No description provided."}</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {(viewingPet.images || []).map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={image} src={image} alt={viewingPet.name} className="h-28 w-full rounded-xl object-cover" />
                ))}
                {(viewingPet.images || []).length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No images uploaded for this pet.
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
