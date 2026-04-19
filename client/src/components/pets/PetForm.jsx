"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUploader from "@/components/ui/image-uploader";
import { api, getAuthHeader } from "@/lib/api";

const createInitialForm = (pet) => ({
  name: pet?.name || "",
  breed: pet?.breed || "",
  age: pet?.age || "",
  category: pet?.category || "Dogs",
  vaccinationStatus: pet?.vaccinationStatus || "",
  antibioticsHistory: pet?.antibioticsHistory || "",
  diseases: pet?.diseases || "",
  healthCondition: pet?.healthCondition || "",
  description: pet?.description || "",
});

export default function PetForm({ pet = null, onSaved }) {
  const [form, setForm] = useState(() => createInitialForm(pet));
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    setSaving(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      files.forEach((file) => data.append("images", file));

      if (pet && (pet._id || pet.id)) {
        const petId = pet._id || pet.id;
        const response = await api.put(`/pets/${petId}`, data, {
          headers: { ...getAuthHeader(), "Content-Type": "multipart/form-data" },
        });
        onSaved?.(response.data.pet);
        return;
      }

      const response = await api.post("/pets", data, {
        headers: { ...getAuthHeader(), "Content-Type": "multipart/form-data" },
      });
      onSaved?.(response.data.pet);
      setForm(createInitialForm(null));
      setFiles([]);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Unable to save pet");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pet-name">Name</Label>
          <Input
            id="pet-name"
            value={form.name}
            onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pet-breed">Breed</Label>
          <Input
            id="pet-breed"
            value={form.breed}
            onChange={(event) => setForm((state) => ({ ...state, breed: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pet-age">Age</Label>
          <Input
            id="pet-age"
            type="number"
            value={form.age}
            onChange={(event) => setForm((state) => ({ ...state, age: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(value) => setForm((state) => ({ ...state, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {["Dogs", "Cats", "Birds", "Fish", "Rabbits", "Others"].map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pet-vax">Vaccination status</Label>
          <Input
            id="pet-vax"
            value={form.vaccinationStatus}
            onChange={(event) => setForm((state) => ({ ...state, vaccinationStatus: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pet-antibiotics">Antibiotics history</Label>
          <Input
            id="pet-antibiotics"
            value={form.antibioticsHistory}
            onChange={(event) => setForm((state) => ({ ...state, antibioticsHistory: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pet-diseases">Diseases</Label>
          <Input
            id="pet-diseases"
            value={form.diseases}
            onChange={(event) => setForm((state) => ({ ...state, diseases: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pet-health">Health condition</Label>
          <Input
            id="pet-health"
            value={form.healthCondition}
            onChange={(event) => setForm((state) => ({ ...state, healthCondition: event.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pet-description">Description</Label>
        <textarea
          id="pet-description"
          value={form.description}
          onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
          className="min-h-[120px] w-full rounded-lg border border-input bg-white/70 px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="space-y-2">
        <Label>Pet images</Label>
        <ImageUploader multiple onChange={(selected) => setFiles(selected)} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : pet ? "Update Pet" : "Create Pet"}
        </Button>
      </div>
    </form>
  );
}
