import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import hearingsRoutes from "./routes/hearings.js";

import multer from "multer";
import mammoth from "mammoth";
import fetch from "node-fetch";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

import path from "path";
import fs from "fs";

// model
import Post from "./models/Post.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// ensure uploads folder exists
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// hearings routes (unchanged)
app.use("/hearings", hearingsRoutes);


// multer setups
const memoryUpload = multer({ storage: multer.memoryStorage() });
const diskUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
  }),
});

// health
app.get("/", (req, res) => res.json({ status: "ok", message: "Server active" }));

// summarizer route (kept as-is)
app.post("/upload", memoryUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: "error", message: "No file uploaded" });

    const file = req.file;
    let text = "";

    if (file.mimetype === "application/pdf") {
      const pdfData = await pdf(file.buffer);
      text = pdfData.text || "";
    } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const docx = await mammoth.extractRawText({ buffer: file.buffer });
      text = docx.value || "";
    } else {
      return res.status(400).json({ status: "error", message: "Unsupported file type. Only PDF/DOCX allowed." });
    }

    if (!text || !text.trim()) return res.status(400).json({ status: "error", message: "Unable to extract enough readable text." });

    text = text.replace(/\s+/g, " ").trim();

    const HF_KEY = process.env.HF_API_KEY;
    if (!HF_KEY) return res.status(500).json({ status: "error", message: "Missing HuggingFace API Key" });

    const HF_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
    const chunks = [];
    for (let i = 0; i < text.length; i += 1500) chunks.push(text.substring(i, i + 1500));

    const summaries = [];
    for (const chunk of chunks) {
      try {
        const hfResp = await fetch(HF_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: chunk }),
        });
        const raw = await hfResp.text();
        let hfData;
        try {
          hfData = JSON.parse(raw);
        } catch {
          hfData = null;
        }
        const summary =
          hfData?.summary_text || hfData?.generated_text || hfData?.[0]?.summary_text || hfData?.[0]?.generated_text || "⚠️ Model could not summarize this part.";
        summaries.push(summary);
      } catch (err) {
        summaries.push("⚠️ Summarizer error");
      }
    }

    return res.json({ status: "success", summary: summaries });
  } catch (err) {
    console.error("Summarizer Error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error: " + err.message });
  }
});

// ------------------ COMMUNITY FORUM ROUTES ------------------

// GET posts (supports optional search/category/location query)
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
app.post("/posts", diskUpload.single("attachment"), async (req, res) => {
  try {
    // log incoming for debugging if needed
    // console.log("Incoming POST /posts body:", req.body);
    // console.log("file:", req.file && req.file.filename);

    const { userName, title, description, category, location } = req.body;

    // category required; userName,title,description required.
    if (!userName || !title || !description || !category) {
      return res.status(400).json({ message: "userName, title, description and category are required." });
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

// LIKE / UNLIKE (expect { userName })
app.post("/posts/:id/like", async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName) return res.status(400).json({ message: "userName is required to like/unlike." });

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

// ADD top-level comment (expect { userName, text })
app.post("/posts/:id/comment", async (req, res) => {
  try {
    const { userName, text } = req.body;
    if (!userName || !text) return res.status(400).json({ message: "userName and text required." });

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

// optional: report route
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
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
