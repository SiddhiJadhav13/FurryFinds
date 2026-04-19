import Link from "next/link";
import { Bone, Cat, Dog, Heart, PawPrint, ShieldCheck, UserRound } from "lucide-react";

export default function HomePage() {
  return (
    <main className="container home-shell">
      <span className="corner-paw corner-paw-left">🐾</span>
      <span className="corner-paw corner-paw-right">🐾</span>

      <section className="glass home-hero">
        <span className="hero-deco hero-ears" aria-hidden />
        <span className="hero-deco hero-tail" aria-hidden />
        <span className="hero-deco hero-bone" aria-hidden>
          <Bone size={16} />
        </span>
        <span className="hero-deco hero-heart" aria-hidden>
          <Heart size={14} />
        </span>

        <article>
          <p className="kicker">Premium Pet Marketplace</p>
          <h1>Find Your Perfect Furry Friend</h1>
          <p className="lead">Adopt, buy, and care for pets with love.</p>
          <div className="floating-paws" aria-hidden>
            <span>
              <PawPrint size={15} />
            </span>
            <span>
              <PawPrint size={17} />
            </span>
            <span>
              <PawPrint size={14} />
            </span>
          </div>
          <div className="row gap-sm wrap">
            <Link href="/auth/client/login" className="btn btn-peach">
              Start as Client
            </Link>
            <Link href="/auth/admin/login" className="btn btn-mint">
              Admin Access
            </Link>
          </div>
        </article>

        <aside className="pet-illustration-wrap" aria-hidden>
          <div className="pet-mascot pet-mascot-puppy">🐶</div>
          <div className="pet-mascot pet-mascot-kitten">😺</div>
          <div className="pet-mascot pet-mascot-adopt">💞</div>
          <div className="pet-bubble pet-bubble-dog">
            <Dog size={40} />
          </div>
          <div className="pet-bubble pet-bubble-cat">
            <Cat size={36} />
          </div>
          <div className="pet-shadow pet-shadow-dog" />
          <div className="pet-shadow pet-shadow-cat" />
        </aside>
      </section>

      <section className="portal-grid">
        <article className="glass portal-card">
          <div className="portal-icon portal-icon-sky">
            <UserRound size={30} />
          </div>
          <div className="card-mini-icons" aria-hidden>
            <span>
              <PawPrint size={14} />
            </span>
            <span>
              <Dog size={14} />
            </span>
          </div>
          <h3>Client Dashboard</h3>
          <p>Browse available pets, save favorites, and track all your requests in one place.</p>
          <div className="row gap-sm wrap" style={{ marginTop: "auto" }}>
            <Link href="/auth/client/login" className="btn btn-sky">
              Client Login
            </Link>
            <Link href="/client/dashboard" className="btn btn-lavender">
              Open Client Dashboard
            </Link>
          </div>
        </article>

        <article className="glass portal-card">
          <div className="portal-icon portal-icon-peach">
            <ShieldCheck size={30} />
          </div>
          <div className="card-mini-icons" aria-hidden>
            <span>
              <Cat size={14} />
            </span>
            <span>
              <Heart size={14} />
            </span>
          </div>
          <h3>Admin Dashboard</h3>
          <p>Manage pets, approvals, and platform updates with a clean and powerful control center.</p>
          <div className="row gap-sm wrap" style={{ marginTop: "auto" }}>
            <Link href="/auth/admin/login" className="btn btn-peach">
              Admin Login
            </Link>
            <Link href="/admin/dashboard" className="btn btn-mint">
              Open Admin Dashboard
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
