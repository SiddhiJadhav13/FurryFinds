"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";

export default function PetDetailPage() {
  const params = useParams();
  const [pet, setPet] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await api.get(`/pets/${params.id}`);
      setPet(data.pet);
    };

    load();
  }, [params.id]);

  if (!pet) {
    return <main className="container simple-center">Loading pet profile...</main>;
  }

  return (
    <main className="container details-page">
      <section className="glass panel">
        <h1>{pet.name}</h1>
        <p>
          {pet.breed} • {pet.category} • {pet.age} years • {pet.gender}
        </p>
        <p className="price">${pet.price}</p>
        <div className="details-grid">
          <p><strong>Vaccination:</strong> {pet.vaccinationStatus}</p>
          <p><strong>Antibiotics / Medical history:</strong> {pet.antibioticsHistory}</p>
          <p><strong>Diseases:</strong> {pet.diseases}</p>
          <p><strong>Health condition:</strong> {pet.healthCondition}</p>
          <p><strong>Description:</strong> {pet.description}</p>
        </div>
        <div className="gallery">
          {(pet.images || []).map((img) => (
            <Image
              key={img}
              src={`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000"}${img}`}
              alt={pet.name}
              width={420}
              height={280}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
