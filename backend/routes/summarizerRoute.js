import express from "express";
import multer from "multer";
import path from "path";
import { summarizeFile } from "../pdfHelper.js";

const router = express.Router();

// Temp upload folder
const upload = multer({
  dest: "uploads/",
});

// POST /upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Call Python / Helper summarize function
    const result = await summarizeFile(filePath, fileName);
    // -----------------------------
    // RETURN FORMAT TO MATCH FRONTEND
    // -----------------------------

    // If file is not legal document
    if (result.isLegal === false) {
      return res.json({
        isLegal: false,
        error: result.error || "Not a legal document",
      });
    }

    // If summarizer throws error
    if (result.status === "error") {
      return res.json({
        status: "error",
        message: result.message || "Something went wrong",
      });
    }

    // SUCCESS
    return res.json({
      status: "success",
      summary: result.summary || "",
    });
  } catch (err) {
    console.error("UPLOAD ROUTE ERROR:", err.message);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

export default router;