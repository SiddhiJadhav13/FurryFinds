import { Heart, Users, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>About FurryFinds</h1>
      <p style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
        FurryFinds is a dedicated animal shelter committed to finding loving homes for pets in need. Our mission is to rescue, rehabilitate, and rehome animals, ensuring they receive the care and affection they deserve.
      </p>
      <div className="services-grid">
        <div className="service-card">
          <div className="service-icon"><Heart size={32} /></div>
          <h3>Compassionate Care</h3>
          <p>We provide medical care, grooming, and socialization for all our animals.</p>
        </div>
        <div className="service-card">
          <div className="service-icon"><Users size={32} /></div>
          <h3>Community Support</h3>
          <p>Our volunteers and donors make it possible to care for hundreds of pets each year.</p>
        </div>
        <div className="service-card">
          <div className="service-icon"><Award size={32} /></div>
          <h3>Successful Adoptions</h3>
          <p>We&apos;ve helped over 500 pets find their forever homes in the past year.</p>
        </div>
      </div>
    </main>
  );
}