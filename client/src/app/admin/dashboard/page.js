"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getAuthHeader } from "@/lib/api";
import { useApp } from "@/context/AppContext";

const emptyPet = {
  name: "",
  category: "Dogs",
  breed: "",
  age: "",
  gender: "Male",
  price: "",
  vaccinationStatus: "",
  antibioticsHistory: "",
  diseases: "",
  healthCondition: "",
  description: "",
};

const emptyKnowledge = {
  title: "",
  category: "Pet diseases",
  excerpt: "",
  content: "",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { auth } = useApp();

  const [analytics, setAnalytics] = useState(null);
  const [pets, setPets] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [messages, setMessages] = useState([]);
  const [petForm, setPetForm] = useState(emptyPet);
  const [petImages, setPetImages] = useState([]);
  const [knowledgeForm, setKnowledgeForm] = useState(emptyKnowledge);
  const [status, setStatus] = useState("");
  const [roleStats, setRoleStats] = useState(null);

  const headers = getAuthHeader();

  const load = async () => {
    try {
      const [analyticsRes, petsRes, usersRes, requestsRes, knowledgeRes, messagesRes] = await Promise.all([
        api.get("/admin/analytics", { headers }),
        api.get("/pets"),
        api.get("/admin/users", { headers }),
        api.get("/requests", { headers }),
        api.get("/knowledge"),
        api.get("/users/contact", { headers }),
      ]);

      const statsRes = await api.get("/users/stats", { headers });

      setAnalytics(analyticsRes.data.analytics);
      setRoleStats(statsRes.data.stats || null);
      setPets(petsRes.data.pets || []);
      setUsers(usersRes.data.users || []);
      setRequests(requestsRes.data.requests || []);
      setKnowledge(knowledgeRes.data.posts || []);
      setMessages(messagesRes.data.messages || []);
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to load admin data");
    }
  };

  useEffect(() => {
    if (auth.loading) {
      return;
    }

    if (!auth.user) {
      router.push("/auth/admin/login");
      return;
    }

    if (auth.profile?.role !== "admin") {
      router.push("/");
      return;
    }

    const init = async () => {
      await load();
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, auth.profile, auth.loading, router]);

  const addPet = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(petForm).forEach(([key, value]) => formData.append(key, value));
      petImages.forEach((file) => formData.append("images", file));

      await api.post("/pets", formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });

      setPetForm(emptyPet);
      setPetImages([]);
      setStatus("Pet listing added");
      load();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to add pet");
    }
  };

  const deletePet = async (id) => {
    try {
      await api.delete(`/pets/${id}`, { headers });
      setStatus("Pet deleted");
      load();
    } catch (error) {
      setStatus(error.response?.data?.message || "Delete failed");
    }
  };

  const editPet = async (pet) => {
    const name = window.prompt("Pet name", pet.name);
    if (!name) return;

    const breed = window.prompt("Breed", pet.breed) || pet.breed;
    const age = window.prompt("Age", String(pet.age)) || String(pet.age);
    const price = window.prompt("Price", String(pet.price)) || String(pet.price);
    const description = window.prompt("Description", pet.description || "") || pet.description;

    try {
      await api.put(
        `/pets/${pet._id}`,
        {
          name,
          category: pet.category,
          breed,
          age,
          gender: pet.gender,
          price,
          vaccinationStatus: pet.vaccinationStatus,
          antibioticsHistory: pet.antibioticsHistory,
          diseases: pet.diseases,
          healthCondition: pet.healthCondition,
          description,
          existingImages: pet.images || [],
        },
        { headers }
      );

      setStatus("Pet listing updated");
      load();
    } catch (error) {
      setStatus(error.response?.data?.message || "Update failed");
    }
  };

  const updateRequestStatus = async (id, statusValue) => {
    try {
      await api.patch(`/requests/${id}/status`, { status: statusValue }, { headers });
      load();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to update request");
    }
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`, { headers });
      load();
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to delete user");
    }
  };

  const addKnowledge = async (e) => {
    e.preventDefault();
    try {
      await api.post("/knowledge", knowledgeForm, { headers });
      setKnowledgeForm(emptyKnowledge);
      setStatus("Knowledge post created");
      load();
    } catch (error) {
      setStatus(error.response?.data?.message || "Could not create post");
    }
  };

  const removeKnowledge = async (id) => {
    try {
      await api.delete(`/knowledge/${id}`, { headers });
      load();
    } catch (error) {
      setStatus(error.response?.data?.message || "Delete failed");
    }
  };

  return (
    <main className="container dashboard">
      <section className="glass section-head">
        <h1>Admin Dashboard</h1>
        <p>Manage users, pets, requests, and pet-care content.</p>
      </section>

      {status && <p className="status">{status}</p>}

      <section className="stats-grid">
        <article className="glass stat"><h3>Total Users</h3><p>{roleStats?.total_users ?? analytics?.totalUsers ?? 0}</p></article>
        <article className="glass stat"><h3>Total Pets</h3><p>{roleStats?.total_pets ?? analytics?.totalPets ?? 0}</p></article>
        <article className="glass stat"><h3>Pending Requests</h3><p>{roleStats?.pending_requests ?? 0}</p></article>
        <article className="glass stat"><h3>Approved</h3><p>{roleStats?.approved_requests ?? 0}</p></article>
      </section>

      <section className="grid-2">
        <article className="glass panel">
          <h2>Add Pet Listing</h2>
          <form className="form-grid" onSubmit={addPet}>
            <input value={petForm.name} onChange={(e) => setPetForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" required />
            <select value={petForm.category} onChange={(e) => setPetForm((p) => ({ ...p, category: e.target.value }))}>
              {['Dogs','Cats','Birds','Fish','Rabbits','Others'].map((c) => <option key={c}>{c}</option>)}
            </select>
            <input value={petForm.breed} onChange={(e) => setPetForm((p) => ({ ...p, breed: e.target.value }))} placeholder="Breed" required />
            <input type="number" value={petForm.age} onChange={(e) => setPetForm((p) => ({ ...p, age: e.target.value }))} placeholder="Age" required />
            <select value={petForm.gender} onChange={(e) => setPetForm((p) => ({ ...p, gender: e.target.value }))}>
              <option>Male</option><option>Female</option>
            </select>
            <input type="number" value={petForm.price} onChange={(e) => setPetForm((p) => ({ ...p, price: e.target.value }))} placeholder="Price" required />
            <input value={petForm.vaccinationStatus} onChange={(e) => setPetForm((p) => ({ ...p, vaccinationStatus: e.target.value }))} placeholder="Vaccination status" />
            <input value={petForm.antibioticsHistory} onChange={(e) => setPetForm((p) => ({ ...p, antibioticsHistory: e.target.value }))} placeholder="Antibiotics / medical history" />
            <input value={petForm.diseases} onChange={(e) => setPetForm((p) => ({ ...p, diseases: e.target.value }))} placeholder="Diseases" />
            <input value={petForm.healthCondition} onChange={(e) => setPetForm((p) => ({ ...p, healthCondition: e.target.value }))} placeholder="Health condition" />
            <textarea value={petForm.description} onChange={(e) => setPetForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" rows={4} />
            <input type="file" multiple accept="image/*" onChange={(e) => setPetImages(Array.from(e.target.files || []))} />
            <button className="btn">Publish Pet</button>
          </form>
        </article>

        <article className="glass panel">
          <h2>Knowledge Post</h2>
          <form className="form-grid" onSubmit={addKnowledge}>
            <input value={knowledgeForm.title} onChange={(e) => setKnowledgeForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" required />
            <select value={knowledgeForm.category} onChange={(e) => setKnowledgeForm((p) => ({ ...p, category: e.target.value }))}>
              {[
                'Pet diseases',
                'Vaccination guides',
                'Medicines and antibiotics',
                'Grooming tips',
                'Pet food guidance',
                'Emergency care',
                'Training tips',
                'General pet care blogs',
              ].map((item) => <option key={item}>{item}</option>)}
            </select>
            <input value={knowledgeForm.excerpt} onChange={(e) => setKnowledgeForm((p) => ({ ...p, excerpt: e.target.value }))} placeholder="Short excerpt" />
            <textarea value={knowledgeForm.content} onChange={(e) => setKnowledgeForm((p) => ({ ...p, content: e.target.value }))} placeholder="Post content" rows={6} required />
            <button className="btn">Publish Post</button>
          </form>
        </article>
      </section>

      <section className="glass panel">
        <h2>Manage Pet Listings</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Breed</th><th>Price</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {pets.map((pet) => (
                <tr key={pet._id}>
                  <td>{pet.name}</td>
                  <td>{pet.breed}</td>
                  <td>${pet.price}</td>
                  <td>{pet.isAvailable ? 'Available' : 'Not Available'}</td>
                  <td className="row gap-xs wrap">
                    <button className="ghost" onClick={() => editPet(pet)}>Edit</button>
                    <button className="ghost" onClick={() => deletePet(pet._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid-2">
        <article className="glass panel">
          <h2>Manage Requests</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Client</th><th>Pet</th><th>Type</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item._id}>
                    <td>{item.client?.name || 'N/A'}</td>
                    <td>{item.pet?.name || 'N/A'}</td>
                    <td>{item.requestType}</td>
                    <td>{item.status}</td>
                    <td className="row gap-xs wrap">
                      <button className="ghost" onClick={() => updateRequestStatus(item._id, 'approved')}>Approve</button>
                      <button className="ghost" onClick={() => updateRequestStatus(item._id, 'rejected')}>Reject</button>
                      <button className="btn-mini" onClick={() => updateRequestStatus(item._id, 'completed')}>Complete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="glass panel">
          <h2>Manage Users</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      {user.role === 'client' && (
                        <button className="ghost" onClick={() => deleteUser(user._id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="grid-2">
        <article className="glass panel">
          <h2>Knowledge Library</h2>
          <div className="list-col">
            {knowledge.map((post) => (
              <div key={post._id} className="row between center item-line">
                <div>
                  <strong>{post.title}</strong>
                  <p>{post.category}</p>
                </div>
                <button className="ghost" onClick={() => removeKnowledge(post._id)}>Delete</button>
              </div>
            ))}
          </div>
        </article>

        <article className="glass panel">
          <h2>Contact Messages</h2>
          <div className="list-col">
            {messages.map((msg) => (
              <div key={msg._id} className="item-line">
                <strong>{msg.subject}</strong>
                <p>{msg.sender?.name} ({msg.sender?.email})</p>
                <p>{msg.message}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
