// src/pages/CommunityForum.tsx
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Trash2, Edit3, Flag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Post = any;

function timeAgo(isoOrDate: string | undefined | any) {
  if (!isoOrDate) return "";
  const d = new Date(isoOrDate);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function CommunityForum() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  // Create form fields (Version B)
  const [userName, setUserName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Help");
  const [location, setLocation] = useState(""); // optional

  // UI state
  const [commentModalOpenFor, setCommentModalOpenFor] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [threadReplies, setThreadReplies] = useState<Record<string, any[]>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState("Help");
  const [editingLocation, setEditingLocation] = useState("");

  const categories = ["Help", "Advice", "Suggestion", "Discussion", "Announcement"];
  const locations = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Pune", "Other"];

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/posts");
      setPosts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost() {
    if (!userName.trim() || !title.trim() || !description.trim() || !category.trim()) {
      alert("Please fill Name, Title, Description and Category.");
      return;
    }

    try {
      await axios.post("http://localhost:5000/posts", {
        userName,
        title,
        description,
        category,
        location, // optional (can be "")
      });

      setUserName("");
      setTitle("");
      setDescription("");
      setCategory("Help");
      setLocation("");

      await loadPosts();
    } catch (err) {
      console.error("Create post failed", err);
      alert("Create failed. See server console.");
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm("Delete this post?")) return;
    try {
      await axios.delete(`http://localhost:5000/posts/${postId}`);
      await loadPosts();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed. See console.");
    }
  }

  function openEdit(post: Post) {
    setEditingPostId(post._id);
    setEditingTitle(post.title);
    setEditingDescription(post.description);
    setEditingCategory(post.category || "Help");
    setEditingLocation(post.location || "");
  }

  async function saveEdit() {
    if (!editingPostId) return;
    if (!editingTitle.trim() || !editingDescription.trim() || !editingCategory.trim()) {
      alert("Please fill required fields.");
      return;
    }
    try {
      await axios.put(`http://localhost:5000/posts/${editingPostId}`, {
        title: editingTitle,
        description: editingDescription,
        category: editingCategory,
        location: editingLocation || "",
      });
      setEditingPostId(null);
      await loadPosts();
    } catch (err) {
      console.error("Edit failed", err);
      alert("Edit failed. See console.");
    }
  }

  async function toggleLike(postId: string, who: string) {
    if (!who || !who.trim()) {
      alert("Please enter your name at the top to like.");
      return;
    }
    try {
      await axios.post(`http://localhost:5000/posts/${postId}/like`, { userName: who });
      await loadPosts();
    } catch (err) {
      console.error("Like failed", err);
      alert("Like failed. See console.");
    }
  }

  async function addComment(postId: string) {
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return alert("Write a comment first.");
    const author = userName?.trim() ? userName.trim() : "Guest";
    try {
      await axios.post(`http://localhost:5000/posts/${postId}/comment`, { userName: author, text });
      setCommentDrafts((s) => ({ ...(s || {}), [postId]: "" }));
      await loadPosts();
    } catch (err) {
      console.error("Comment failed", err);
      alert("Comment failed. See console.");
    }
  }

  function addThreadReply(postId: string, parentIndex: number, text: string) {
    if (!text.trim()) return;
    setThreadReplies((prev) => {
      const copy = { ...(prev || {}) };
      copy[postId] = copy[postId] || [];
      copy[postId].push({ parentIndex, userName: userName?.trim() || "Guest", text: text.trim(), createdAt: new Date().toISOString() });
      return copy;
    });
  }

  function getThreadReplies(postId: string) {
    return threadReplies[postId] || [];
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Justice Hub — Community</h1>
            <p className="text-slate-600 mt-1">Share your thoughts, ask for help, and support each other.</p>
          </div>
        </div>

        {/* Create form */}
        <Card className="mb-6 p-4 shadow-sm bg-white">
          <CardContent>
            <div className="flex gap-3">
              <Input placeholder="Your name (required)" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-1/4" />
              <Input placeholder="Post title (required)" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
            </div>

            <div className="mt-3 flex gap-3">
              <Textarea placeholder="Description (required)" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-1" rows={3} />
              <div className="w-64 flex flex-col gap-2">
                <select className="p-2 rounded-md border" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => (<option key={c}>{c}</option>))}
                </select>

                <select className="p-2 rounded-md border" value={location} onChange={(e) => setLocation(e.target.value)}>
                  <option value="">Select location (optional)</option>
                  {locations.map((l) => (<option key={l} value={l}>{l}</option>))}
                </select>

                <Button onClick={handleCreatePost} className="mt-2">Post</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          {loading && <div className="text-center text-slate-500">Loading posts…</div>}
          {!loading && posts.length === 0 && <div className="text-center text-slate-500">No posts yet — be the first to share!</div>}

          {posts.map((post) => {
            const replies = getThreadReplies(post._id);
            return (
              <motion.div key={post._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="shadow-sm">
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">{String(post.userName || "U").charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{post.title}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">{post.category}</span>
                          </div>
                          <div className="text-sm text-slate-500">{post.userName} • {post.location || "Unknown"} • {timeAgo(post.createdAt)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-500">
                        <button onClick={() => toggleLike(post._id, userName || "Guest")} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100">
                          <Heart size={16} className="text-red-500" />
                          <span className="text-sm">{Array.isArray(post.likedBy) ? post.likedBy.length : 0}</span>
                        </button>

                        <button onClick={() => setCommentModalOpenFor(post._id)} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100">
                          <MessageCircle size={16} />
                          <span className="text-sm">{(post.comments || []).length}</span>
                        </button>

                        <button onClick={() => openEdit(post)} className="p-1 rounded hover:bg-slate-100"><Edit3 size={16} /></button>
                        <button onClick={() => handleDelete(post._id)} className="p-1 rounded hover:bg-slate-100"><Trash2 size={16} /></button>
                        <button onClick={() => { alert("Report received (demo)"); }} className="p-1 rounded hover:bg-slate-100"><Flag size={16} /></button>
                      </div>
                    </div>

                    <div className="mt-4">
                      {editingPostId === post._id ? (
                        <div className="space-y-2">
                          <Input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} />
                          <Textarea value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} rows={4} />
                          <div className="flex gap-2">
                            <select className="p-2 rounded-md border" value={editingCategory} onChange={(e) => setEditingCategory(e.target.value)}>
                              {categories.map((c) => (<option key={c}>{c}</option>))}
                            </select>
                            <select className="p-2 rounded-md border" value={editingLocation} onChange={(e) => setEditingLocation(e.target.value)}>
                              <option value="">Location (optional)</option>
                              {locations.map((l) => (<option key={l} value={l}>{l}</option>))}
                            </select>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button onClick={saveEdit}>Save</Button>
                            <Button variant="ghost" onClick={() => setEditingPostId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-800 whitespace-pre-wrap">{post.description}</p>
                      )}
                    </div>

                    <div className="mt-4 text-sm text-slate-500">
                      <span>{post.comments?.length || 0} comments</span>
                      <span className="mx-2">•</span>
                      <span>Likes: {Array.isArray(post.likedBy) ? post.likedBy.length : 0}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* comment modal */}
                <AnimatePresence>
                  {commentModalOpenFor === post._id && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <motion.div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden" initial={{ y: 20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.98 }}>
                        <div className="flex items-center justify-between p-4 border-b">
                          <div>
                            <h3 className="font-semibold">Comments — {post.title}</h3>
                            <div className="text-sm text-slate-500">{post.userName} • {timeAgo(post.createdAt)}</div>
                          </div>
                          <button onClick={() => setCommentModalOpenFor(null)} className="p-2"><X /></button>
                        </div>

                        <div className="p-4 max-h-[60vh] overflow-auto space-y-3">
                          {(post.comments || []).map((c: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-lg border">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-medium">{String(c.userName || "G").charAt(0).toUpperCase()}</div>
                                    <div>
                                      <div className="text-sm font-medium">{c.userName}</div>
                                      <div className="text-xs text-slate-500">{timeAgo(c.createdAt)}</div>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-sm text-slate-800">{c.text}</div>
                                </div>
                                <div className="text-xs text-slate-400">#{idx + 1}</div>
                              </div>

                              <div className="mt-3 ml-10 space-y-2">
                                {getThreadReplies(post._id).filter(r => r.parentIndex === idx).map((r, rIdx) => (
                                  <div key={rIdx} className="p-2 bg-slate-50 rounded-md">
                                    <div className="text-sm font-medium">{r.userName} • <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span></div>
                                    <div className="text-sm">{r.text}</div>
                                  </div>
                                ))}

                                <ReplyInput postId={post._id} parentIndex={idx} onReply={(text) => addThreadReply(post._id, idx, text)} placeholder={`Reply to ${c.userName}...`} />
                              </div>
                            </div>
                          ))}

                          <div className="mt-2 p-2 rounded-md border">
                            <Input placeholder="Write a comment…" value={commentDrafts[post._id] || ""} onChange={(e) => setCommentDrafts((s) => ({ ...(s || {}), [post._id]: e.target.value }))} />
                            <div className="flex gap-2 mt-2">
                              <Button onClick={() => addComment(post._id)}>Post comment</Button>
                              <Button variant="ghost" onClick={() => setCommentModalOpenFor(null)}>Close</Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ReplyInput component (local state per input) */
function ReplyInput({ postId, parentIndex, onReply, placeholder }: { postId: string; parentIndex: number; onReply: (text: string) => void; placeholder?: string }) {
  const [text, setText] = useState("");
  return (
    <div className="flex gap-2">
      <Input placeholder={placeholder || "Write a reply..."} value={text} onChange={(e) => setText(e.target.value)} />
      <Button onClick={() => { if (text.trim()) { onReply(text); setText(""); } }}>Reply</Button>
    </div>
  );
}

