import Link from "next/link";
import { Heart } from "lucide-react";

export default function PetsPage() {
  const pets = [
    { name: "Loki", img: "/assets/cat1.jpg", type: "Cat" },
    { name: "Sassy", img: "/assets/cat2.jpg", type: "Cat" },
    { name: "Cleo & Miso", img: "/assets/cat3.jpg", type: "Cats" },
    { name: "Mochi", img: "/assets/cat4.jpg", type: "Cat" },
    { name: "Bailey & Ziggy", img: "/assets/dog1.jpg", type: "Dogs" },
    { name: "Oreo", img: "/assets/dog2.jpg", type: "Dog" },
    { name: "Luna", img: "/assets/dog3.jpg", type: "Dog" },
    { name: "Milo", img: "/assets/dog4.jpg", type: "Dog" },
  ];

  return (
    <main className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Our Pets</h1>
      <div className="pet-grid">
        {pets.map((pet, i) => (
          <article key={i} className="pet-card">
            <div className="pet-img-box">
              <img src={pet.img} alt={pet.name} />
            </div>
            <div className="pet-name-tag">{pet.name}</div>
            <p style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--muted)' }}>{pet.type}</p>
            <Link href="/auth/client/signup" className="btn btn-peach" style={{ width: '100%', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={16} /> Adopt Me
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}