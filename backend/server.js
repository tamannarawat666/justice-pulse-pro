import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import hearingsRoutes from "./routes/hearings.js";

import multer from "multer";
import path from "path";
import fs from "fs";

// Community Forum model
import Post from "./models/Post.js";

// NEW: summarizer route (clean version)
import summarizerRoutes from "./routes/summarize.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Ensure uploads folder exists
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Hearings route
app.use("/hearings", hearingsRoutes);

// Summarizer route (THE ONLY ONE NOW)
app.use("/summarize", summarizerRoutes);

// Health check
app.get("/", (req, res) => res.json({ status: "ok", message: "Server active" }));

// ------------------ COMMUNITY FORUM ROUTES ------------------

// GET posts
app.get("/posts", async (req, res) => {
  try {
    const { search, category, location } = req.query;
    const filter = {};

    if (category && category !== "All Topics") filter.category = category;
    if (location) filter.location = location;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const posts = await Post.find(filter).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("GET /posts error:", err);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

// CREATE post
const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) =>
      cb(null, Date.now() + path.extname(file.originalname)),
  }),
});

app.post("/posts", diskUpload.single("attachment"), async (req, res) => {
  try {
    const { userName, title, description, category, location } = req.body;

    if (!userName || !title || !description || !category) {
      return res
        .status(400)
        .json({ message: "userName, title, description and category are required." });
    }

    const newPost = new Post({
      userName,
      title,
      description,
      category,
      location: location || "",
      attachmentUrl: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error("CREATE /posts error:", err);
    res.status(500).json({ message: "Server error while creating post" });
  }
});

// EDIT post
app.put("/posts/:id", async (req, res) => {
  try {
    const { title, description, category, location } = req.body;
    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { title, description, category, location: location || "" },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Post not found" });
    res.json(updated);
  } catch (err) {
    console.error("PUT /posts/:id error:", err);
    res.status(500).json({ message: "Error updating post" });
  }
});

// DELETE post
app.delete("/posts/:id", async (req, res) => {
  try {
    const deleted = await Post.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("DELETE /posts/:id error:", err);
    res.status(500).json({ message: "Error deleting post" });
  }
});

// LIKE
app.post("/posts/:id/like", async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName)
      return res.status(400).json({ message: "userName is required to like/unlike." });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const already = post.likedBy.includes(userName);
    if (already) {
      post.likedBy = post.likedBy.filter((u) => u !== userName);
    } else {
      post.likedBy.push(userName);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error("LIKE error:", err);
    res.status(500).json({ message: "Like error" });
  }
});

// COMMENT
app.post("/posts/:id/comment", async (req, res) => {
  try {
    const { userName, text } = req.body;
    if (!userName || !text)
      return res.status(400).json({ message: "userName and text required." });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ userName, text, createdAt: new Date() });
    await post.save();
    res.json(post);
  } catch (err) {
    console.error("COMMENT error:", err);
    res.status(500).json({ message: "Comment error" });
  }
});

// REPORT
app.post("/posts/:id/report", async (req, res) => {
  try {
    const { userName, reason } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.reports.push({ userName, reason, createdAt: new Date() });
    await post.save();
    res.json(post);
  } catch (err) {
    console.error("REPORT error:", err);
    res.status(500).json({ message: "Report error" });
  }
});

// ------------------ DB CONNECT ------------------
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ DB Error:", err));
