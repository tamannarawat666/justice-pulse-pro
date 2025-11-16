import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CommunityForum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

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
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        post_likes(user_id),
        comments(
          *
        )
      `)
      .order("created_at", { ascending: false });

    if (!error) setPosts(data || []);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    await supabase.from("posts").insert([
      {
        user_id: user?.id,
        user_name: user?.name || "Anonymous",
        title: "Post",
        content: newPostContent,
        category: "General",
      },
    ]);

    setNewPostContent("");
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

  const handleComment = async (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    await supabase.from("comments").insert([
      {
        user_id: user?.id,
        user_name: user?.name || "Anonymous",
        post_id: postId,
        content: commentText,
      },
    ]);

    setCommentInputs({ ...commentInputs, [postId]: "" });
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Hey, {user?.name || "Friend"} 👋
          </h1>
          <p className="text-muted-foreground">
            Share your thoughts, experiences, or advice with the community
          </p>
        </div>

        {/* CREATE POST */}
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold flex-shrink-0">
                {(user?.name || "?").charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Share what's on your mind…"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
                />

                <div className="flex justify-end">
                  <Button 
                    onClick={handleCreatePost} 
                    disabled={!newPostContent.trim()}
                    className="rounded-full px-8"
                  >
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* POSTS FEED */}
        <div className="space-y-4">
          {posts.map((post: any) => (
            <Card key={post.id} className="border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold flex-shrink-0">
                    {(post.user_name || "?").charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-base">{post.user_name || "Anonymous"}</span>
                      <span className="text-xs text-muted-foreground">
                        • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* ACTIONS */}
                    <div className="flex gap-6 pb-3 border-b border-border">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors group"
                      >
                        <Heart 
                          className={post.post_likes?.some((l: any) => l.user_id === user?.id) ? "fill-red-500 text-red-500" : "group-hover:fill-red-500/20"} 
                          size={20}
                        />
                        <span className="text-sm font-medium">{post.post_likes?.length || 0} Likes</span>
                      </button>

                      <button 
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MessageCircle size={20} />
                        <span className="text-sm font-medium">
                          {post.comments?.length || 0} Comments
                        </span>
                      </button>
                    </div>

                    {/* COMMENTS SECTION - EXPANDABLE */}
                    {expandedComments.has(post.id) && (
                      <div className="mt-4 space-y-4">
                        {/* EXISTING COMMENTS */}
                        {post.comments && post.comments.length > 0 && (
                          <div className="space-y-3">
                            {post.comments.map((comment: any) => (
                              <div key={comment.id} className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-accent/50 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                  {(comment.user_name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 bg-accent/20 rounded-xl px-4 py-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-semibold text-sm">{comment.user_name || "Anonymous"}</p>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* COMMENT INPUT */}
                        <div className="flex gap-3 items-start">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {(user?.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 flex gap-2">
                            <Textarea
                              placeholder="Write a kind reply… ❤️"
                              value={commentInputs[post.id] || ""}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                              className="min-h-[60px] resize-none text-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleComment(post.id);
                                }
                              }}
                            />
                            <Button 
                              size="sm"
                              onClick={() => handleComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                              className="self-end"
                            >
                              <Send size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {posts.length === 0 && (
            <Card className="border-border shadow-sm">
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground mb-2">
                  No posts yet. Be the first to share! ✨
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Your voice matters here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
