import express from "express";
import multer from "multer";
import mammoth from "mammoth";
import fetch from "node-fetch";
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// FIX for pdf-parse CommonJS
const pdfParse = require("pdf-parse");

const router = express.Router();

// File upload setup
const upload = multer({ dest: "uploads/" });

// Hugging Face API key
const API_KEY = process.env.HUGGINGFACE_API_KEY;

// Utility: Split large text into chunks
function chunkText(text, size = 2500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.substring(i, i + size));
  }
  return chunks;
}

// Hugging Face Summarization
async function summarizeChunk(chunk) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: chunk }),
      }
    );

    const data = await response.json();

    if (Array.isArray(data) && data[0]?.summary_text) {
      return data[0].summary_text;
    } else {
      return "⚠️ Model could not summarize this part.";
    }
  } catch (error) {
    return "⚠️ Error summarizing this part.";
  }
}

// Route: Handle Summarization
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    let extractedText = "";

    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(fs.readFileSync(filePath));
      extractedText = data.text;
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      extractedText = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: "No readable text found in document" });
    }

    // Split into chunks
    const chunks = chunkText(extractedText);

    // Summarize each chunk
    let finalSummary = "";
    for (const chunk of chunks) {
      const summary = await summarizeChunk(chunk);
      finalSummary += summary + "\n\n";
    }

    fs.unlinkSync(filePath);

    return res.json({
      originalLength: extractedText.length,
      summaryLength: finalSummary.length,
      summary: finalSummary,
    });
  } catch (error) {
    console.error("Summary Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
