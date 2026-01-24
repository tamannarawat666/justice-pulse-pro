import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import multer from "multer";
import fetch from "node-fetch";

import hearingsRoutes from "./routes/hearings.js";
import postsRoutes from "./routes/posts.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Ensure uploads folder exists
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ------------------- YOUR ORIGINAL ROUTES -------------------
app.use("/hearings", hearingsRoutes);
app.use("/posts", postsRoutes);
// ------------------------------------------------------------

// ------------------- ADDING SUMMARIZER ROUTE -------------------

// Multer to handle uploaded PDF/DOCX
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) =>
      cb(null, Date.now() + path.extname(file.originalname)),
  }),
});

// Route: POST /summarize
app.post("/summarize", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filepath = path.join(process.cwd(), "uploads", req.file.filename);

    // SEND FILE TO PYTHON API
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filepath));

    const response = await fetch("http://127.0.0.1:8000/summarize", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Summarizer Error:", err);
    res.status(500).json({ error: "Summarization failed" });
  }
});

// -------------------------------------------------------------

// Root Route
app.get("/", (req, res) => {
  res.send("JusticePulse API Running");
});

// ------------------- DATABASE CONNECTION -------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("DB Error:", err));
// ------------------------------------------------------------

// Start Server
app.listen(process.env.PORT || 5000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
});
