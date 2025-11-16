import express from "express";
import Post from "../models/Post.js";

const router = express.Router();

// Allowed location choices
const ALLOWED_LOCATIONS = ["India", "USA", "UK"];

// -------------------- CREATE POST --------------------
router.post("/", async (req, res) => {
  try {
    const { title, content, location } = req.body;

    // Validate location if provided
    if (location && !ALLOWED_LOCATIONS.includes(location)) {
      return res.status(400).json({ error: "Invalid location choice" });
    }

    const post = new Post({ title, content, location });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------- GET ALL POSTS --------------------
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- LIKE POST --------------------
router.post("/:id/like", async (req, res) => {
  try {
    const { userName } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ error: "Post not found" });

    if (!post.likedBy.includes(userName)) {
      post.likedBy.push(userName);
      post.likes += 1;
    } else {
      post.likedBy = post.likedBy.filter((u) => u !== userName);
      post.likes -= 1;
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------- ADD COMMENT --------------------
router.post("/:id/comment", async (req, res) => {
  try {
    const { userName, text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ userName, text });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------- REPLY TO COMMENT --------------------
router.post("/:id/comment/:commentId/reply", async (req, res) => {
  try {
    const { userName, text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    comment.replies.push({ userName, text });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------- EDIT POST --------------------
router.put("/:id", async (req, res) => {
  try {
    const { location } = req.body;
    if (location && !ALLOWED_LOCATIONS.includes(location)) {
      return res.status(400).json({ error: "Invalid location choice" });
    }

    const updated = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------- DELETE POST --------------------
router.delete("/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------- REPORT POST --------------------
router.post("/:id/report", async (req, res) => {
  try {
    const { userName, reason } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.reports.push({ userName, reason });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
