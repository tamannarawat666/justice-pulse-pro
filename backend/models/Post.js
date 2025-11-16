import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  userName: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});

const commentSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: [replySchema], // optional — currently front-end keeps threaded replies client-side, but schema supports them
});

const postSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },  // author name
    title: { type: String, required: true },
    description: { type: String, required: true },

    category: {
      type: String,
      enum: ["Help", "Advice", "Suggestion", "Discussion", "Announcement"],
      required: true,
      default: "Help",
    },

    // location optional
    location: { type: String, default: "" },

    // likes stored as array of userName strings
    likedBy: { type: [String], default: [] },

    // comments array
    comments: { type: [commentSchema], default: [] },

    // attachment URL (optional)
    attachmentUrl: { type: String, default: null },

    // reports (optional)
    reports: [
      {
        userName: String,
        reason: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// optional virtual for likes count (not required but handy)
postSchema.virtual("likes").get(function () {
  return Array.isArray(this.likedBy) ? this.likedBy.length : 0;
});

export default mongoose.model("Post", postSchema);
