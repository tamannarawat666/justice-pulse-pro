import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Heart, MessageCircle, Send, Sparkles, MapPin, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  content: string;
  category: string;
  location: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

const CATEGORIES = [
  'All Topics',
  'Family Law',
  'Property Law',
  'Cybercrime',
  'Consumer Rights',
  'Employment Law',
  'Criminal Law',
  'Civil Rights',
  'General Support'
];

const CommunityForum = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: '',
    location: ''
  });
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  // Fetch posts
  useEffect(() => {
    fetchPosts();
    
    // Set up realtime subscription for posts
    const postsChannel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          fetchPosts();
          toast({
            title: "✨ New activity!",
            description: "Someone just shared something in the community",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [selectedCategory, selectedLocation]);

  const fetchPosts = async () => {
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'All Topics') {
      query = query.eq('category', selectedCategory);
    }

    if (selectedLocation) {
      query = query.ilike('location', `%${selectedLocation}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    // Check which posts the user has liked
    if (isAuthenticated && user) {
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      const likedPostIds = new Set(likesData?.map(like => like.post_id) || []);
      
      const postsWithLikes = (data || []).map(post => ({
        ...post,
        is_liked: likedPostIds.has(post.id)
      }));

      setPosts(postsWithLikes);
    } else {
      setPosts(data || []);
    }
  };

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    setComments(prev => ({ ...prev, [postId]: data || [] }));

    // Set up realtime subscription for comments
    const commentsChannel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchComments(postId);
        }
      )
      .subscribe();
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      toast({
        title: "Please login first",
        description: "You need to be logged in to share your story",
        variant: "destructive"
      });
      return;
    }

    if (!newPost.title || !newPost.content || !newPost.category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        user_name: user.name,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        location: newPost.location || null
      });

    if (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "🎉 Post shared!",
      description: "Your voice matters. Thank you for sharing with the community!",
    });

    setNewPost({ title: '', content: '', category: '', location: '' });
    setShowNewPostForm(false);
    fetchPosts();
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Please login first",
        description: "Login to show your support",
        variant: "destructive"
      });
      return;
    }

    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error unliking post:', error);
        return;
      }
    } else {
      // Like
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        });

      if (error) {
        console.error('Error liking post:', error);
        return;
      }

      toast({
        title: "❤️ Support sent!",
        description: "Your kindness makes a difference",
      });
    }

    fetchPosts();
  };

  const handleAddComment = async (postId: string) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Please login first",
        description: "Login to join the conversation",
        variant: "destructive"
      });
      return;
    }

    const content = newComment[postId]?.trim();
    if (!content) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        user_name: user.name,
        content
      });

    if (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "💬 Comment added!",
      description: "Thank you for being part of the conversation",
    });

    setNewComment(prev => ({ ...prev, [postId]: '' }));
    fetchComments(postId);
  };

  const toggleComments = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) {
        fetchComments(postId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Welcome to the Justice Hub Community
          </h1>
          {isAuthenticated ? (
            <p className="text-xl text-muted-foreground mb-2">
              Hey {user?.name} 👋, how's your day going?
            </p>
          ) : (
            <p className="text-xl text-muted-foreground mb-2">
              Hey there 👋, join our community to share and connect!
            </p>
          )}
          <p className="text-lg text-muted-foreground">
            Want to share or explore something today?
          </p>
        </div>

        {/* Conversation Starters */}
        <Card className="mb-8 border-2 gradient-card shadow-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Let's get started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 text-left justify-start"
                onClick={() => setShowNewPostForm(true)}
              >
                <div>
                  <p className="font-semibold">What legal topic are you curious about today?</p>
                  <p className="text-sm text-muted-foreground mt-1">Share your thoughts</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 text-left justify-start"
                onClick={() => setSelectedLocation(user?.name || '')}
              >
                <div>
                  <p className="font-semibold">Would you like to see what others nearby are discussing?</p>
                  <p className="text-sm text-muted-foreground mt-1">Connect with neighbors</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 text-left justify-start"
              >
                <div>
                  <p className="font-semibold">Need advice or want to help someone?</p>
                  <p className="text-sm text-muted-foreground mt-1">Browse the community</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* New Post Form */}
        {showNewPostForm && (
          <Card className="mb-8 animate-scale-in shadow-glow">
            <CardHeader>
              <CardTitle>Share Your Story</CardTitle>
              <CardDescription>
                Your experience can help others. Every story matters here. 💙
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <Input
                    placeholder="What's on your mind? (Title)"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Share your thoughts, experiences, or questions..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    required
                    className="min-h-[120px]"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Select
                    value={newPost.category}
                    onValueChange={(value) => setNewPost({ ...newPost, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(cat => cat !== 'All Topics').map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Your location (optional)"
                    value={newPost.location}
                    onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    Share with Community
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewPostForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[200px]">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filter by location..."
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {!showNewPostForm && (
            <Button onClick={() => setShowNewPostForm(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              New Post
            </Button>
          )}
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-lg text-muted-foreground">
                  No posts yet. Be the first to share! 🌟
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="shadow-custom hover:shadow-glow transition-all animate-fade-in">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{post.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="font-semibold">{post.user_name}</span>
                        <span>•</span>
                        <span>{post.category}</span>
                        {post.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {post.location}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap mb-4">{post.content}</p>
                  
                  {/* Interaction Buttons */}
                  <div className="flex gap-4 items-center border-t pt-4">
                    <Button
                      variant={post.is_liked ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleLikePost(post.id, post.is_liked || false)}
                      className="transition-all"
                    >
                      <Heart className={`w-4 h-4 mr-2 ${post.is_liked ? 'fill-current' : ''}`} />
                      {post.likes_count} {post.likes_count === 1 ? 'Heart' : 'Hearts'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {post.comments_count} {post.comments_count === 1 ? 'Reply' : 'Replies'}
                    </Button>
                  </div>

                  {/* Comments Section */}
                  {expandedPost === post.id && (
                    <div className="mt-6 space-y-4 animate-fade-in">
                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-4">Conversation</h4>
                        
                        {/* Comment Input */}
                        <div className="flex gap-2 mb-4">
                          <Input
                            placeholder="Share your thoughts..."
                            value={newComment[post.id] || ''}
                            onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(post.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3">
                          {comments[post.id]?.map((comment) => (
                            <div
                              key={comment.id}
                              className="bg-muted/50 rounded-lg p-3 animate-slide-up"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-sm">{comment.user_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                          ))}
                          {comments[post.id]?.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Be the first to reply and show your support! 💙
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityForum;
