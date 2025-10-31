import express from "express";
import ForumPost from "../models/ForumPost.js";  // model
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Create a post
router.post("/post", verifyToken, async (req, res) => {
  try {
    const { title, content, category, location } = req.body;

    const newPost = new ForumPost({
      title,
      content,
      category,
      location,
      user: req.user.id, // logged-in user
    });

    await newPost.save();

    res.status(201).json({
      success: true,
      message: "Post created successfully!",
      post: newPost,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
