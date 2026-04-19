"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { api, getAuthHeader } from "@/lib/api";
import { useApp } from "@/context/AppContext";

const categories = ["", "Dogs", "Cats", "Birds", "Fish", "Rabbits", "Others"];

export default function ClientDashboardPage() {
  const router = useRouter();
  const { auth, logout } = useApp();

  const [pets, setPets] = useState([]);
  const [knowledgePosts, setKnowledgePosts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [status, setStatus] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    breed: "",
    minAge: "",
    maxAge: "",
    minPrice: "",
    maxPrice: "",
  });

  const [contact, setContact] = useState({ subject: "", message: "" });

  const [stats, setStats] = useState(null);

  const summary = useMemo(() => {
    const availablePets = pets.length;
    return {
      availablePets,
      wishlistCount: Number(stats?.saved_pets_count ?? wishlist.length),
      totalRequests: Number(stats?.total_requests ?? requests.length),
      approvedRequests: Number(
        stats?.approved_requests ?? requests.filter((item) => item.status === "approved").length
      ),
    };
  }, [pets, wishlist, requests, stats]);

  useEffect(() => {
    if (auth.loading) {
      return;
    }

    if (!auth.user) {
      router.push("/auth/client/login");
      return;
    }

    if (auth.profile?.role !== "client") {
      router.push("/");
      return;
    }

    const load = async () => {
      try {
        const headers = getAuthHeader();
        const [petsRes, reqRes, wishRes, statsRes, knowledgeRes] = await Promise.all([
          api.get("/pets", { params: { available: true } }),
          api.get("/requests/my", { headers }),
          api.get("/users/wishlist", { headers }),
          api.get("/users/stats", { headers }),
          api.get("/knowledge"),
        ]);

        setPets(petsRes.data.pets || []);
        setRequests(reqRes.data.requests || []);
        setWishlist(wishRes.data.wishlist || []);
        setStats(statsRes.data.stats || null);
        setKnowledgePosts(knowledgeRes.data.posts || []);
      } catch (error) {
        const code = error.response?.status;
        const message = error.response?.data?.message || "Failed to load dashboard data";

        if (code === 401) {
          logout();
          setStatus("Session expired. Please login again as client.");
          router.push("/auth/client/login");
          return;
        }

        if (code === 403) {
          setStatus("Access denied for current session. Please log in as a client account.");
          return;
        }

        setStatus(message);
      }
    };

    load();
  }, [auth.user, auth.profile, auth.loading, router, logout]);

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      if (filters.category && pet.category !== filters.category) return false;
      if (filters.search) {
        const key = filters.search.toLowerCase();
        const hay = `${pet.name} ${pet.breed} ${pet.description}`.toLowerCase();
        if (!hay.includes(key)) return false;
      }
      if (filters.breed && !pet.breed.toLowerCase().includes(filters.breed.toLowerCase())) return false;
      if (filters.minAge && pet.age < Number(filters.minAge)) return false;
      if (filters.maxAge && pet.age > Number(filters.maxAge)) return false;
      if (filters.minPrice && pet.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && pet.price > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [pets, filters]);

  const isWished = (petId) => wishlist.some((item) => item._id === petId);

  const toggleWishlist = async (petId) => {
    try {
      const headers = getAuthHeader();
      const { data } = await api.post(`/users/wishlist/${petId}`, {}, { headers });
      setWishlist(data.wishlist || []);
    } catch (error) {
      setStatus(error.response?.data?.message || "Could not update wishlist");
    }
  };

  const requestPet = async (petId, requestType) => {
    try {
      const headers = getAuthHeader();
      const { data } = await api.post(
        "/requests",
        { petId, requestType, note: "Looking forward to meeting this pet." },
        { headers }
      );
      setRequests((prev) => [data.request, ...prev]);
      setStatus("Request submitted successfully");
    } catch (error) {
      setStatus(error.response?.data?.message || "Could not submit request");
    }
  };

  const sendContact = async (e) => {
    e.preventDefault();
    try {
      const headers = getAuthHeader();
      await api.post("/users/contact", contact, { headers });
      setContact({ subject: "", message: "" });
      setStatus("Message sent to admin");
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to send message");
    }
  };

  return (
    <main className="container dashboard">
      <section className="glass section-head">
        <h1>Client Dashboard</h1>
        <p>Browse, save, and request your perfect companion.</p>
      </section>

      {status && <p className="status">{status}</p>}

      <section className="stats-grid">
        <article className="glass stat">
          <h3>Available Pets</h3>
          <p>{summary.availablePets}</p>
        </article>
        <article className="glass stat">
          <h3>Saved Pets</h3>
          <p>{summary.wishlistCount}</p>
        </article>
        <article className="glass stat">
          <h3>Total Requests</h3>
          <p>{summary.totalRequests}</p>
        </article>
        <article className="glass stat">
          <h3>Approved</h3>
          <p>{summary.approvedRequests}</p>
        </article>
      </section>

      <section className="glass panel">
        <h2>Find Pets</h2>
        <div className="filter-grid">
          <input
            placeholder="Search name, breed, description"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c || "All Categories"}
              </option>
            ))}
          </select>
          <input
            placeholder="Breed"
            value={filters.breed}
            onChange={(e) => setFilters((p) => ({ ...p, breed: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Min Age"
            value={filters.minAge}
            onChange={(e) => setFilters((p) => ({ ...p, minAge: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Max Age"
            value={filters.maxAge}
            onChange={(e) => setFilters((p) => ({ ...p, maxAge: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value }))}
          />
        </div>

        <div className="cards-grid pets-grid">
          {filteredPets.map((pet, idx) => (
            <motion.article
              className="pet-card"
              key={pet._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <div className="pet-image-wrap">
                <Image
                  src={`${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000"}${
                    pet.images?.[0] || ""
                  }`}
                  alt={pet.name}
                  fill
                  sizes="(max-width: 680px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="pet-body">
                <h3>{pet.name}</h3>
                <p>
                  {pet.breed} • {pet.age} yrs • {pet.gender}
                </p>
                <p className="price">${pet.price}</p>
                <div className="row gap-sm wrap">
                  <button className="ghost" onClick={() => toggleWishlist(pet._id)}>
                    {isWished(pet._id) ? "Saved" : "Save"}
                  </button>
                  <button className="ghost" onClick={() => requestPet(pet._id, "adopt")}>
                    Adopt
                  </button>
                  <button className="btn" onClick={() => requestPet(pet._id, "buy")}>
                    Buy
                  </button>
                  <Link href={`/pets/${pet._id}`} className="ghost">
                    Details
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
          {filteredPets.length === 0 && (
            <article className="glass panel" style={{ gridColumn: "1 / -1" }}>
              <h3>No pets match your filters</h3>
              <p>Try changing category, age, or price range to see more options.</p>
            </article>
          )}
        </div>
      </section>

      <section className="glass panel">
        <h2>Request History</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pet</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item._id}>
                  <td>{item.pet?.name || "N/A"}</td>
                  <td>{item.requestType}</td>
                  <td>{item.status}</td>
                  <td>{format(new Date(item.createdAt), "dd MMM yyyy")}</td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={4}>No requests yet. Start by adopting or buying a pet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid-2">
        <article className="glass panel">
          <h2>Contact Admin</h2>
          <form className="form-grid" onSubmit={sendContact}>
            <input
              value={contact.subject}
              onChange={(e) => setContact((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Subject"
              required
            />
            <textarea
              value={contact.message}
              onChange={(e) => setContact((p) => ({ ...p, message: e.target.value }))}
              placeholder="Your message"
              rows={4}
              required
            />
            <button className="btn">Send Message</button>
          </form>
        </article>

        <article className="glass panel">
          <h2>Pet Care Knowledge</h2>
          <div className="knowledge-list">
            {knowledgePosts.slice(0, 6).map((post) => (
              <Link key={post._id} href={`/knowledge/${post._id}`} className="knowledge-item">
                <strong>{post.title}</strong>
                <span>{post.category}</span>
              </Link>
            ))}
            {knowledgePosts.length === 0 && (
              <div className="knowledge-item">
                <strong>No posts yet</strong>
                <span>New pet-care guides will appear here.</span>
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
