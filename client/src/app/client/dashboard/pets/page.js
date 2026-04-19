"use client";

import PetsTable from "@/components/pets/PetsTable";

export default function ClientPetsPage() {
  return (
    <div className="space-y-6">
      <section className="dash-panel dashboard-hero-panel">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Client Panel</p>
        <h1 className="dash-title text-3xl">My Pets</h1>
        <p className="text-muted-foreground">Manage your pet listings - add, edit, or remove pets.</p>
      </section>

      <section className="dash-panel dashboard-section-shell">
        <PetsTable />
      </section>
    </div>
  );
}
