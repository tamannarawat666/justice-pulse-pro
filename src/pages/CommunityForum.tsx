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

    // Real-time subscription for new posts and updates
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        () => {
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'post_likes',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    if (!newPost.content) {
      return;
    }

    let attachmentUrl = null;

    if (newPost.attachment) {
      const fileName = `${Date.now()}-${newPost.attachment.name}`;
      const { data: fileData } = await supabase.storage
        .from("forum-attachments")
        .upload(fileName, newPost.attachment);

      attachmentUrl = fileData?.path || null;
    }

    // Insert post - it will appear instantly via real-time subscription
    await supabase.from("posts").insert([
      {
        user_id: user?.id,
        user_name: user?.name || "Anonymous",
        title: newPost.title || "Untitled",
        content: newPost.content,
        category: newPost.category || "General",
        location: newPost.location,
        attachment_url: attachmentUrl,
      },
    ]);

    // Clear form immediately (Twitter-style)
    setNewPost({ title: "", content: "", category: "", location: "", attachment: null });
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        
        {/* WARM PERSONAL GREETING */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold mb-2">
            Hey, {user?.name || "Friend"} 👋
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            How are you feeling today? Want to share something or explore what others are talking about?
          </p>
          
          {/* CONVERSATION STARTERS */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <div className="px-4 py-2 rounded-full bg-accent/40 hover:bg-accent/60 transition-all cursor-pointer text-sm border border-border/50">
              💭 What legal topic are you curious about?
            </div>
            <div className="px-4 py-2 rounded-full bg-accent/40 hover:bg-accent/60 transition-all cursor-pointer text-sm border border-border/50">
              🤝 Need advice or want to help?
            </div>
            <div className="px-4 py-2 rounded-full bg-accent/40 hover:bg-accent/60 transition-all cursor-pointer text-sm border border-border/50">
              💙 What&apos;s on your mind?
            </div>
          </div>

          {/* ENCOURAGING MESSAGE */}
          <p className="text-sm text-muted-foreground/70 italic">
            Your voice matters here. Someone may relate to your story.
          </p>
        </div>

        {/* CREATE POST (TWITTER-STYLE COMPACT) */}
        <Card className="border-border/50 shadow-lg bg-card/90 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/50 flex items-center justify-center text-lg font-semibold flex-shrink-0">
                {(user?.name || "?").charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Share what's on your mind… 💭"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="min-h-[100px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none text-base bg-transparent p-0"
                />

                {/* OPTIONAL FIELDS - COLLAPSIBLE */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Topic (optional)"
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="text-sm border-border/50 rounded-full h-9"
                  />
                  <Input
                    placeholder="Location"
                    value={newPost.location}
                    onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                    className="text-sm border-border/50 rounded-full h-9"
                  />
                </div>

                {newPost.attachment && (
                  <div className="flex items-center gap-2 text-sm bg-accent/50 px-3 py-2 rounded-full border border-border/50 w-fit">
                    <span className="truncate max-w-[200px]">{newPost.attachment.name}</span>
                    <X
                      className="cursor-pointer hover:text-destructive flex-shrink-0"
                      size={16}
                      onClick={() => setNewPost({ ...newPost, attachment: null })}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <label className="cursor-pointer text-muted-foreground hover:text-primary transition-colors">
                    <Upload size={18} />
                    <input
                      type="file"
                      hidden
                      onChange={(e) => setNewPost({ ...newPost, attachment: e.target.files?.[0] || null })}
                    />
                  </label>

                  <Button 
                    onClick={handleCreatePost} 
                    disabled={!newPost.content.trim()}
                    className="rounded-full px-6 font-medium"
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FEED HEADER */}
        <div className="flex items-center justify-between pt-4">
          <h2 className="text-xl font-semibold">Community Feed</h2>
          <Input 
            placeholder="Search..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 h-9 rounded-full border-border/50 text-sm"
          />
        </div>

        {/* POSTS FEED (TWITTER-STYLE) */}
        <div className="space-y-4">
          {posts.map((post: any) => (
            <Card key={post.id} className="border-border/50 hover:border-border transition-all bg-card/90 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-base font-semibold flex-shrink-0">
                    {(post.user_name || "?").charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold">{post.user_name || "Anonymous"}</span>
                      <span className="text-xs text-muted-foreground">• {post.category}</span>
                    </div>

                    <p className="text-foreground/90 leading-relaxed mb-3 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {post.attachment_url && (
                      <a
                        href={supabase.storage.from("forum-attachments").getPublicUrl(post.attachment_url).data.publicUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm mb-3"
                      >
                        📎 Attachment
                      </a>
                    )}

                    {/* ACTIONS */}
                    <div className="flex gap-4 py-2">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors group"
                      >
                        <Heart 
                          className={post.post_likes?.some((l: any) => l.user_id === user?.id) ? "fill-red-500 text-red-500" : "group-hover:fill-red-500/20"} 
                          size={18}
                        />
                        <span className="text-sm">{post.post_likes?.length || 0}</span>
                      </button>

                      <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle size={18} />
                        <span className="text-sm">{post.comments?.length || 0}</span>
                      </button>
                    </div>

                    {/* COMMENTS SECTION */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="mt-4 space-y-3 pt-4 border-t border-border/30">
                        {post.comments.map((comment: any) => (
                          <div key={comment.id} className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {(comment.user_name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 bg-accent/20 rounded-2xl px-4 py-2.5 border border-border/20">
                              <p className="font-semibold text-sm mb-0.5">{comment.user_name || "Anonymous"}</p>
                              <p className="text-sm text-foreground/80">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* COMMENT INPUT */}
                    <div className="flex gap-2 mt-3">
                      <Input
                        placeholder="Write a kind reply… ❤️"
                        className="rounded-full border-border/50 text-sm h-9"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value.trim()) {
                            handleComment(post.id, e.currentTarget.value);
                            e.currentTarget.value = "";
                          }
                        }}
                      />
                      <Button 
                        size="sm"
                        className="rounded-full px-4"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input.value.trim()) {
                            handleComment(post.id, input.value);
                            input.value = "";
                          }
                        }}
                      >
                        <Send size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {posts.length === 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground mb-2">
                  No posts yet. Be the first to share! ✨
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Your story could inspire someone today.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
