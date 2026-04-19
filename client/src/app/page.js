import Link from "next/link";
import { Bone, Cat, Dog, Heart, PawPrint, Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const pets = [
    { name: "Loki", img: "/assets/cat1.jpg" },
    { name: "Sassy", img: "/assets/cat2.jpg" },
    { name: "Cleo & Miso", img: "/assets/cat_basket.png" },
    { name: "Mochi", img: "/assets/cat_white.png" },
    { name: "Bailey & Ziggy", img: "/assets/cat4.jpg" },
    { name: "Oreo", img: "/assets/dog2.jpg" },
    { name: "Luna", img: "/assets/dog3.jpg" },
    { name: "Milo", img: "/assets/dog4.jpg" },
  ];

  return (
    <main className="home-shell">
      {/* Hero Section */}
      <section className="container hero-section">
        <div className="hero-content text-center mx-auto flex flex-col items-center">
          <p className="kicker">Say Hello To Your New Buddy</p>
          <h1 className="text-center">Our Shelter Is Filled With Loving Animals Hoping For A Forever Home.</h1>
          <p className="lead text-center">
            They&apos;re Waiting For Someone Like You To Give Them Warmth, Love, And Care. 
            Will You Be The One To Change Their Life?
          </p>
          <div className="row gap-sm wrap justify-center">
            <Link href="/auth/client/signup" className="btn btn-peach px-10 py-4">
              Adopt A Pet
            </Link>
            <Link href="/auth/admin/login" className="btn btn-sky px-10 py-4">
              Admin Login
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <Image 
            src="/assets/hero.jpg" 
            alt="Hero Pets" 
            fill
            className="object-contain"
            priority
          />
        </div>
      </section>

      {/* Services Section */}
      <section className="container">
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon"><PawPrint size={32} /></div>
            <h3>Adopt A Pet</h3>
            <p>Find your perfect companion among our many lovable rescues.</p>
          </div>
          <div className="service-card">
            <div className="service-icon"><Heart size={32} /></div>
            <h3>Be A Volunteer</h3>
            <p>Help us care for animals in need by donating your time.</p>
          </div>
          <div className="service-card">
            <div className="service-icon"><Bone size={32} /></div>
            <h3>Donate For Them</h3>
            <p>Your contributions help us provide food and medical care.</p>
          </div>
        </div>
      </section>

      {/* Lovely Souls Grid */}
      <section className="container" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>These Lovely Souls Are Waiting For You</h2>
        <p className="lead" style={{ margin: '0 auto 2rem' }}>
          Tap A Pet To Learn More About Them And Their Story.
        </p>
        <div className="pet-grid">
          {pets.map((pet, i) => (
            <article key={i} className="pet-card">
              <div className="pet-img-box relative">
                <Image 
                  src={pet.img} 
                  alt={pet.name} 
                  fill
                  className="object-cover"
                />
              </div>
              <div className="pet-name-tag">{pet.name}</div>
            </article>
          ))}
        </div>
        <button className="btn btn-peach" style={{ marginTop: '3rem', background: '#A67C52', color: '#fff' }}>More</button>
      </section>

      {/* Journey Stats */}
      <section className="journey-section">
        <div className="container">
          <h2 style={{ fontSize: '2.5rem' }}>Our Journey In Numbers</h2>
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-circle"><Cat size={48} /></div>
              <h3>20</h3>
              <p>Cats</p>
            </div>
            <div className="stat-item">
              <div className="stat-circle"><Dog size={48} /></div>
              <h3>15</h3>
              <p>Dogs</p>
            </div>
            <div className="stat-item">
              <div className="stat-circle"><Heart size={48} /></div>
              <h3>19</h3>
              <p>Adopted</p>
            </div>
            <div className="stat-item">
              <div className="stat-circle"><Bone size={48} /></div>
              <h3>25</h3>
              <p>Volunteers</p>
            </div>
          </div>
        </div>
      </section>


      {/* Main Footer */}
      <footer id="footer" className="main-footer">
        <div className="container footer-grid">
          <div className="footer-column">
            <div className="footer-logo">
              <PawPrint size={28} /> FurryFinds
            </div>
            <h4>Address</h4>
            <ul>
              <li>New Valley Bhandup</li>
              <li>Mumbai, Maharashtra</li>
              <li>400608</li>
              <li>India</li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Trusted Clients</h4>
            <ul>
              <li>Rahul Sharma</li>
              <li>Priya Patel</li>
              <li>Amit Kumar</li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Follow Us</h4>
            <ul>
              <li>LinkedIn</li>
              <li>Instagram</li>
              <li>Facebook</li>
              <li>TikTok</li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Contact Us</h4>
            <form className="contact-form">
              <input type="email" placeholder="Enter Your Email" />
              <input type="tel" placeholder="Phone Number" />
              <textarea placeholder="Fax/Optional"></textarea>
              <button type="submit" className="btn btn-peach" style={{ width: '100%', borderRadius: '8px' }}>Submit</button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          Copyright © 2025 FurryFinds. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

