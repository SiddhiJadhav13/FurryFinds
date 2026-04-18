const KnowledgePost = require("../models/KnowledgePost");
const appDataService = require("../services/appDataService");

const useMongo = () => Boolean(process.env.MONGODB_URI);

const getAllKnowledgePosts = async (req, res) => {
  const query = {};
  if (req.query.category) {
    query.category = req.query.category;
  }

  const posts = useMongo()
    ? await KnowledgePost.find(query).populate("author", "name").sort("-createdAt")
    : await appDataService.getKnowledgePosts({ category: req.query.category });
  return res.json({ success: true, posts });
};

const getKnowledgePostById = async (req, res) => {
  const post = useMongo()
    ? await KnowledgePost.findById(req.params.id).populate("author", "name")
    : await appDataService.getKnowledgePostById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  return res.json({ success: true, post });
};

const createKnowledgePost = async (req, res) => {
  const userId = req.user.id || req.user._id;

  const post = useMongo()
    ? await KnowledgePost.create({
        ...req.body,
        coverImage: req.file ? `/uploads/${req.file.filename}` : req.body.coverImage || "",
        author: userId,
      })
    : await appDataService.createKnowledgePost({
        ...req.body,
        coverImage: req.file ? `/uploads/${req.file.filename}` : req.body.coverImage || "",
        author: userId,
      });

  return res.status(201).json({ success: true, post });
};

const updateKnowledgePost = async (req, res) => {
  const existing = useMongo()
    ? await KnowledgePost.findById(req.params.id)
    : await appDataService.getKnowledgePostById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  const post = useMongo()
    ? await KnowledgePost.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          coverImage: req.file ? `/uploads/${req.file.filename}` : req.body.coverImage || existing.coverImage,
        },
        { new: true, runValidators: true }
      )
    : await appDataService.updateKnowledgePost(req.params.id, {
        ...req.body,
        coverImage: req.file ? `/uploads/${req.file.filename}` : req.body.coverImage || existing.coverImage,
      });

  return res.json({ success: true, post });
};

const deleteKnowledgePost = async (req, res) => {
  const post = useMongo()
    ? await KnowledgePost.findByIdAndDelete(req.params.id)
    : await appDataService.deleteKnowledgePost(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: "Post not found" });
  }

  return res.json({ success: true, message: "Post deleted" });
};

module.exports = {
  getAllKnowledgePosts,
  getKnowledgePostById,
  createKnowledgePost,
  updateKnowledgePost,
  deleteKnowledgePost,
};
