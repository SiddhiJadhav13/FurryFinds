const fs = require("fs/promises");
const path = require("path");

const DATA_FILE = path.join(process.cwd(), "data", "app-data.json");

const defaultData = () => ({
  pets: [],
  knowledgePosts: [],
  requests: [],
  contacts: [],
  wishlists: {},
});

const ensureDataFile = async () => {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData(), null, 2), "utf8");
  }
};

const readData = async () => {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const parsed = raw ? JSON.parse(raw) : defaultData();
  return {
    ...defaultData(),
    ...parsed,
    wishlists: parsed.wishlists || {},
  };
};

const writeData = async (data) => {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
};

const buildId = (prefix) => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const normalizePet = (pet) => ({
  _id: pet._id,
  name: pet.name,
  category: pet.category,
  breed: pet.breed,
  age: Number(pet.age),
  gender: pet.gender,
  price: Number(pet.price),
  vaccinationStatus: pet.vaccinationStatus || "Not updated",
  antibioticsHistory: pet.antibioticsHistory || "Not updated",
  diseases: pet.diseases || "None reported",
  healthCondition: pet.healthCondition || "Healthy",
  description: pet.description || "",
  images: Array.isArray(pet.images) ? pet.images : [],
  isAvailable: pet.isAvailable !== false,
  postedBy: pet.postedBy,
  createdAt: pet.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const sortItems = (items, sort) => {
  const value = sort || "-createdAt";
  const desc = value.startsWith("-");
  const key = desc ? value.slice(1) : value;

  return [...items].sort((a, b) => {
    if (a[key] < b[key]) return desc ? 1 : -1;
    if (a[key] > b[key]) return desc ? -1 : 1;
    return 0;
  });
};

const getPets = async ({ filters = {}, sort = "-createdAt" }) => {
  const db = await readData();
  let pets = [...db.pets];

  if (filters.category) pets = pets.filter((p) => p.category === filters.category);
  if (filters.breed) pets = pets.filter((p) => new RegExp(filters.breed, "i").test(p.breed));
  if (filters.search) {
    const regex = new RegExp(filters.search, "i");
    pets = pets.filter((p) => regex.test(p.name) || regex.test(p.breed) || regex.test(p.description));
  }
  if (filters.age?.$gte != null) pets = pets.filter((p) => Number(p.age) >= Number(filters.age.$gte));
  if (filters.age?.$lte != null) pets = pets.filter((p) => Number(p.age) <= Number(filters.age.$lte));
  if (filters.price?.$gte != null) pets = pets.filter((p) => Number(p.price) >= Number(filters.price.$gte));
  if (filters.price?.$lte != null) pets = pets.filter((p) => Number(p.price) <= Number(filters.price.$lte));
  if (filters.isAvailable === true) pets = pets.filter((p) => p.isAvailable);

  return sortItems(pets, sort);
};

const getPetById = async (id) => {
  const db = await readData();
  return db.pets.find((p) => p._id === id) || null;
};

const createPet = async (payload) => {
  const db = await readData();
  const pet = normalizePet({ ...payload, _id: buildId("pet") });
  db.pets.push(pet);
  await writeData(db);
  return pet;
};

const updatePet = async (id, payload) => {
  const db = await readData();
  const index = db.pets.findIndex((p) => p._id === id);
  if (index === -1) return null;

  db.pets[index] = normalizePet({ ...db.pets[index], ...payload, _id: id, createdAt: db.pets[index].createdAt });
  await writeData(db);
  return db.pets[index];
};

const deletePet = async (id) => {
  const db = await readData();
  const index = db.pets.findIndex((p) => p._id === id);
  if (index === -1) return false;
  db.pets.splice(index, 1);
  await writeData(db);
  return true;
};

const setPetAvailability = async (id, isAvailable) => {
  const db = await readData();
  const index = db.pets.findIndex((p) => p._id === id);
  if (index === -1) return null;
  db.pets[index].isAvailable = isAvailable;
  db.pets[index].updatedAt = new Date().toISOString();
  await writeData(db);
  return db.pets[index];
};

const getKnowledgePosts = async ({ category }) => {
  const db = await readData();
  const posts = category
    ? db.knowledgePosts.filter((p) => p.category === category)
    : [...db.knowledgePosts];
  return sortItems(posts, "-createdAt");
};

const getKnowledgePostById = async (id) => {
  const db = await readData();
  return db.knowledgePosts.find((p) => p._id === id) || null;
};

const createKnowledgePost = async (payload) => {
  const db = await readData();
  const post = {
    _id: buildId("post"),
    title: payload.title,
    category: payload.category,
    excerpt: payload.excerpt || "",
    content: payload.content,
    coverImage: payload.coverImage || "",
    author: payload.author,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.knowledgePosts.push(post);
  await writeData(db);
  return post;
};

const updateKnowledgePost = async (id, payload) => {
  const db = await readData();
  const index = db.knowledgePosts.findIndex((p) => p._id === id);
  if (index === -1) return null;

  db.knowledgePosts[index] = {
    ...db.knowledgePosts[index],
    ...payload,
    _id: id,
    updatedAt: new Date().toISOString(),
  };
  await writeData(db);
  return db.knowledgePosts[index];
};

const deleteKnowledgePost = async (id) => {
  const db = await readData();
  const index = db.knowledgePosts.findIndex((p) => p._id === id);
  if (index === -1) return false;
  db.knowledgePosts.splice(index, 1);
  await writeData(db);
  return true;
};

const createRequest = async (payload) => {
  const db = await readData();
  const request = {
    _id: buildId("req"),
    clientId: payload.clientId,
    petId: payload.petId,
    requestType: payload.requestType,
    note: payload.note || "",
    status: "pending",
    amount: Number(payload.amount || 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.requests.push(request);
  await writeData(db);
  return request;
};

const getRequestsByClient = async (clientId) => {
  const db = await readData();
  const rows = db.requests.filter((r) => String(r.clientId) === String(clientId));
  return sortItems(rows, "-createdAt");
};

const getAllRequests = async () => {
  const db = await readData();
  return sortItems(db.requests, "-createdAt");
};

const findActiveRequestByClientAndPet = async (clientId, petId) => {
  const db = await readData();
  return (
    db.requests.find(
      (r) =>
        String(r.clientId) === String(clientId) &&
        String(r.petId) === String(petId) &&
        ["pending", "approved"].includes(r.status)
    ) || null
  );
};

const updateRequestStatus = async (id, status) => {
  const db = await readData();
  const index = db.requests.findIndex((r) => r._id === id);
  if (index === -1) return null;
  db.requests[index].status = status;
  db.requests[index].updatedAt = new Date().toISOString();
  await writeData(db);
  return db.requests[index];
};

const getWishlistPetIds = async (userId) => {
  const db = await readData();
  return db.wishlists[String(userId)] || [];
};

const getWishlistPets = async (userId) => {
  const db = await readData();
  const ids = db.wishlists[String(userId)] || [];
  return db.pets.filter((p) => ids.includes(p._id));
};

const toggleWishlistPet = async (userId, petId) => {
  const db = await readData();
  const key = String(userId);
  const current = db.wishlists[key] || [];
  db.wishlists[key] = current.includes(petId)
    ? current.filter((id) => id !== petId)
    : [...current, petId];
  await writeData(db);
  return db.pets.filter((p) => db.wishlists[key].includes(p._id));
};

const createContactMessage = async (payload) => {
  const db = await readData();
  const contact = {
    _id: buildId("msg"),
    sender: payload.sender,
    subject: payload.subject,
    message: payload.message,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.contacts.push(contact);
  await writeData(db);
  return contact;
};

const getContactMessages = async () => {
  const db = await readData();
  return sortItems(db.contacts, "-createdAt");
};

module.exports = {
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  setPetAvailability,
  getKnowledgePosts,
  getKnowledgePostById,
  createKnowledgePost,
  updateKnowledgePost,
  deleteKnowledgePost,
  createRequest,
  getRequestsByClient,
  getAllRequests,
  findActiveRequestByClientAndPet,
  updateRequestStatus,
  getWishlistPetIds,
  getWishlistPets,
  toggleWishlistPet,
  createContactMessage,
  getContactMessages,
};
