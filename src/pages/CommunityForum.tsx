import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MessageCircle, Send, Upload, Filter, X } from "lucide-react";

export default function CommunityForum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "",
    location: "",
    attachment: null,
  });
  const [selectedCategory, setSelectedCategory] = useState("All Topics");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState({});

  const categories = ["General", "Legal Advice", "Support", "Resources"];
  const locations = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad"];

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, selectedLocation, searchQuery]);

  const fetchPosts = async () => {
    let query = supabase
      .from("posts")
      .select(`
        *,
        profiles(full_name),
        post_likes(user_id),
        comments(
          *,
          profiles(full_name)
        )
      `)
      .order("created_at", { ascending: false });

    if (selectedCategory !== "All Topics") {
      query = query.eq("category", selectedCategory);
    }

    if (selectedLocation) {
      query = query.ilike("location", `%${selectedLocation}%`);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (!error) setPosts(data || []);
  };

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) return;

    let attachmentUrl = null;

    if (newPost.attachment) {
      const fileName = `${Date.now()}-${newPost.attachment.name}`;
      const { data: fileData } = await supabase.storage
        .from("attachments")
        .upload(fileName, newPost.attachment);

      attachmentUrl = fileData?.path || null;
    }

    await supabase.from("posts").insert([
      {
        user_id: user?.id,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        location: newPost.location,
        attachment_url: attachmentUrl,
      },
    ]);

    setNewPost({ title: "", content: "", category: "", location: "", attachment: null });
    fetchPosts();
  };

  const handleLike = async (postId: string) => {
    const { data: alreadyLiked } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", user?.id)
      .single();

    if (alreadyLiked) {
      await supabase.from("post_likes").delete().eq("id", alreadyLiked.id);
    } else {
      await supabase.from("post_likes").insert([{ post_id: postId, user_id: user?.id }]);
    }

    fetchPosts();
  };

  const handleComment = async (postId: string, commentText: string) => {
    if (!commentText.trim()) return;

    await supabase.from("comments").insert([
      {
        user_id: user?.id,
        post_id: postId,
        content: commentText,
      },
    ]);

    fetchPosts();
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* CREATE POST FORM */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Create a Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <Input
            placeholder="Title"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          />

          <Textarea
            placeholder="Share your thoughts..."
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          />

          <div className="flex gap-2">
            <Input
              placeholder="Category (ex: Support)"
              value={newPost.category}
              onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
            />
            <Input
              placeholder="Location (ex: Delhi)"
              value={newPost.location}
              onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Upload size={18} />
              <span>Attach File (optional)</span>
              <input
                type="file"
                hidden
                onChange={(e) => setNewPost({ ...newPost, attachment: e.target.files?.[0] || null })}
              />
            </label>

            {newPost.attachment && (
              <div className="flex items-center gap-1 text-sm bg-gray-200 px-2 py-1 rounded-full">
                {newPost.attachment.name}
                <X
                  className="cursor-pointer"
                  size={16}
                  onClick={() => setNewPost({ ...newPost, attachment: null })}
                />
              </div>
            )}
          </div>

          <Button onClick={handleCreatePost} className="w-full">
            Post
          </Button>
        </CardContent>
      </Card>

      {/* FILTERS */}
      <div className="flex gap-3">
        <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <Button variant="outline">
          <Filter size={18} />
        </Button>
      </div>

      {/* POSTS LIST */}
      {posts.map((post: any) => (
        <Card key={post.id} className="shadow-md">
          <CardContent className="pt-4">
            <h3 className="font-semibold text-lg">{post.title}</h3>
            <p className="text-gray-700">{post.content}</p>

            {post.attachment_url && (
              <a
                href={supabase.storage.from("attachments").getPublicUrl(post.attachment_url).data.publicUrl}
                target="_blank"
                className="text-blue-600 underline"
              >
                View Attachment
              </a>
            )}

            <div className="flex gap-4 mt-4">
              <Button variant="ghost" onClick={() => handleLike(post.id)}>
                <Heart className={post.post_likes?.some((l: any) => l.user_id === user?.id) ? "text-red-500" : ""} />
                {post.post_likes?.length || 0}
              </Button>

              <Button variant="ghost">
                <MessageCircle /> {post.comments?.length || 0}
              </Button>
            </div>

            {/* COMMENT INPUT */}
            <div className="flex mt-3 gap-2">
              <Input
                placeholder="Write a comment..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleComment(post.id, e.currentTarget.value);
                }}
              />
              <Button>
                <Send size={16} />
              </Button>
            </div>

            {/* COMMENTS */}
            <div className="mt-3 space-y-2">
              {post.comments?.map((comment: any) => (
                <div key={comment.id} className="bg-gray-100 p-2 rounded-md">
                  <p className="font-semibold">{comment.profiles?.full_name || "User"}</p>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>

          </CardContent>
        </Card>
      ))}
    </div>
  );
}
