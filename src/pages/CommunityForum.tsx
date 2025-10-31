import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MessageCircle, Send, Upload, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CommunityForum() {
  const { user } = useAuth();
  const { toast } = useToast();
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
    if (!newPost.title || !newPost.content) {
      toast({
        title: "Missing information",
        description: "Please add a title and share your thoughts 💙",
        variant: "destructive"
      });
      return;
    }

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
        user_name: user?.name || "Anonymous",
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        location: newPost.location,
        attachment_url: attachmentUrl,
      },
    ]);

    setNewPost({ title: "", content: "", category: "", location: "", attachment: null });
    fetchPosts();
    
    toast({
      title: "Thank you for sharing ❤️",
      description: "Someone will connect with you soon. You're heard and valued.",
    });
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
        user_name: user?.name || "Anonymous",
        post_id: postId,
        content: commentText,
      },
    ]);

    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* WARM PERSONAL GREETING */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur">
          <CardContent className="pt-6">
            <h1 className="text-3xl font-bold mb-2">
              Hey, {user?.name || "Friend"} 👋
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              How's your day going? Want to share something or explore what others are talking about today?
            </p>
            
            {/* CONVERSATION STARTERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer border border-border/50">
                <p className="text-sm font-medium">💭 What legal topic are you curious about today?</p>
              </div>
              <div className="p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer border border-border/50">
                <p className="text-sm font-medium">🤝 Need advice or want to help someone near you?</p>
              </div>
              <div className="p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer border border-border/50">
                <p className="text-sm font-medium">💙 Feeling overwhelmed? You're safe here — tell us what's going on.</p>
              </div>
              <div className="p-4 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer border border-border/50">
                <p className="text-sm font-medium">✨ Have a small win today? Share and inspire others</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CREATE POST FORM */}
        <Card className="border-none shadow-xl bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Share Your Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="What would you like to share? ✨"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="border-border/50 focus:border-primary rounded-xl"
            />

            <Textarea
              placeholder="Share what's on your mind… You're in a safe space here. 💙"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="min-h-[120px] border-border/50 focus:border-primary rounded-xl resize-none"
            />

            <div className="flex gap-2">
              <Input
                placeholder="Topic (e.g., Support, Legal Advice)"
                value={newPost.category}
                onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                className="border-border/50 focus:border-primary rounded-xl"
              />
              <Input
                placeholder="Location (optional)"
                value={newPost.location}
                onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                className="border-border/50 focus:border-primary rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl bg-accent/50 hover:bg-accent transition-colors">
                <Upload size={18} />
                <span className="text-sm">Attach File (optional)</span>
                <input
                  type="file"
                  hidden
                  onChange={(e) => setNewPost({ ...newPost, attachment: e.target.files?.[0] || null })}
                />
              </label>

              {newPost.attachment && (
                <div className="flex items-center gap-2 text-sm bg-accent px-3 py-2 rounded-full border border-border">
                  <span>{newPost.attachment.name}</span>
                  <X
                    className="cursor-pointer hover:text-destructive"
                    size={16}
                    onClick={() => setNewPost({ ...newPost, attachment: null })}
                  />
                </div>
              )}
            </div>

            <Button 
              onClick={handleCreatePost} 
              className="w-full rounded-xl font-medium text-base h-12"
            >
              Share with Community 💬
            </Button>
          </CardContent>
        </Card>

        {/* FILTERS */}
        <div className="flex gap-3">
          <Input 
            placeholder="Search for topics or keywords..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border-border/50"
          />
          <Button variant="outline" className="rounded-xl">
            <Filter size={18} />
          </Button>
        </div>

        {/* POSTS LIST */}
        {posts.map((post: any) => (
          <Card key={post.id} className="border-none shadow-lg hover:shadow-xl transition-shadow bg-card/80 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-lg font-semibold">
                  {(post.user_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-1">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">{post.user_name || "Anonymous"} • {post.category}</p>
                </div>
              </div>

              <p className="text-foreground/90 leading-relaxed mb-4">{post.content}</p>

              {post.attachment_url && (
                <a
                  href={supabase.storage.from("forum-attachments").getPublicUrl(post.attachment_url).data.publicUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm mb-4"
                >
                  📎 View Attachment
                </a>
              )}

              <div className="flex gap-3 mt-4 pt-4 border-t border-border/50">
                <Button 
                  variant="ghost" 
                  onClick={() => handleLike(post.id)}
                  className="rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 gap-2"
                >
                  <Heart 
                    className={post.post_likes?.some((l: any) => l.user_id === user?.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"} 
                    size={20}
                  />
                  <span className="text-sm">{post.post_likes?.length || 0} {(post.post_likes?.length || 0) === 1 ? "person" : "people"} care</span>
                </Button>

                <Button variant="ghost" className="rounded-full gap-2">
                  <MessageCircle size={20} className="text-muted-foreground" />
                  <span className="text-sm">{post.comments?.length || 0} {(post.comments?.length || 0) === 1 ? "reply" : "replies"}</span>
                </Button>
              </div>

              {/* COMMENT INPUT */}
              <div className="flex mt-4 gap-2">
                <Input
                  placeholder="Write a kind reply… ❤️"
                  className="rounded-xl border-border/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      handleComment(post.id, e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button 
                  className="rounded-xl"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input.value.trim()) {
                      handleComment(post.id, input.value);
                      input.value = "";
                    }
                  }}
                >
                  <Send size={16} />
                </Button>
              </div>

              {/* COMMENTS */}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-4 space-y-3">
                  {post.comments.map((comment: any) => (
                    <div 
                      key={comment.id} 
                      className="bg-accent/30 p-4 rounded-xl border border-border/30"
                    >
                      <p className="font-semibold text-sm mb-1">{comment.user_name || "Anonymous"}</p>
                      <p className="text-foreground/80">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

            </CardContent>
          </Card>
        ))}

        {posts.length === 0 && (
          <Card className="border-none shadow-lg bg-card/50 backdrop-blur">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-lg text-muted-foreground">
                No posts yet. Be the first to share your story! ✨
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
