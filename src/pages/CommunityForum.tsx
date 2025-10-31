import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Send, Filter, Sparkles, ThumbsUp, Handshake, Scale } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import confetti from "canvas-confetti/dist/confetti.module.mjs";


interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  location: string | null;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
  post_likes: { user_id: string }[];
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
  };
}

const CONVERSATION_STARTERS = [
  "What legal topic are you curious about today?",
  "Need advice or want to help someone near you?",
  "Have you faced a legal challenge recently?",
  "What's your experience with the justice system?",
];

const REACTION_EMOJIS = [
  { emoji: '❤️', label: 'support', icon: Heart },
  { emoji: '🙌', label: 'helpful', icon: ThumbsUp },
  { emoji: '⚖️', label: 'justice', icon: Scale },
  { emoji: '🤝', label: 'solidarity', icon: Handshake },
];

const CATEGORIES = [
  'All',
  'Family Law',
  'Property',
  'Cybercrime',
  'Consumer Rights',
  'Employment',
  'Criminal',
  'Other'
];

export default function Community() {
  const { user, profile, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Debug: Verify profile is available
  console.log('Community - profile:', profile);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Family Law');
  const [location, setLocation] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterLocation, setFilterLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>({});
  const [showStarter, setShowStarter] = useState(true);
  const [currentStarter, setCurrentStarter] = useState(CONVERSATION_STARTERS[0]);

  useEffect(() => {
    fetchPosts();
    subscribeToRealtimeUpdates();
    
    // Rotate conversation starters
    const interval = setInterval(() => {
      setCurrentStarter(CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)]);
    }, 8000);
    
    return () => clearInterval(interval);
  }, []);

  const subscribeToRealtimeUpdates = () => {
    const postsChannel = supabase
      .channel('posts-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel('comments-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    const likesChannel = supabase
      .channel('likes-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(likesChannel);
    };
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles(full_name),
        post_likes(user_id),
        comments(
          *,
          profiles(full_name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    setPosts(data as any || []);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to create a post',
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user!.id,
        title: title.trim(),
        content: content.trim(),
        category,
        location: location.trim() || null,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Post created successfully',
      });
      setTitle('');
      setContent('');
      setLocation('');
    }

    setLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to like posts',
        variant: 'destructive',
      });
      return;
    }

    const post = posts.find(p => p.id === postId);
    const hasLiked = post?.post_likes.some(like => like.user_id === user!.id);

    if (hasLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user!.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to unlike post',
          variant: 'destructive',
        });
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user!.id });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to like post',
          variant: 'destructive',
        });
      }
    }
  };

  const handleComment = async (postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to comment',
        variant: 'destructive',
      });
      return;
    }

    const commentContent = commentInputs[postId]?.trim();
    if (!commentContent) return;

    const post = posts.find(p => p.id === postId);
    const isFirstComment = post?.comments.length === 0;

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user!.id,
        content: commentContent,
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } else {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      
      // Celebrate first comment!
      if (isFirstComment) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast({
          title: '🎉 First Reply!',
          description: 'You just made someone\'s day! Thank you for being supportive.',
        });
      }
    }
  };

  const handleThankUser = (userName: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
    toast({
      title: '💝 Gratitude Sent!',
      description: `${userName} will feel the love. Thank you for spreading kindness!`,
    });
  };

  const simulateTyping = (postId: string, userName: string) => {
    setTypingUsers(prev => ({ ...prev, [postId]: userName }));
    setTimeout(() => {
      setTypingUsers(prev => {
        const newState = { ...prev };
        delete newState[postId];
        return newState;
      });
    }, 3000);
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = filterCategory === 'All' || post.category === filterCategory;
    const matchesLocation = !filterLocation || post.location?.toLowerCase().includes(filterLocation.toLowerCase());
    return matchesCategory && matchesLocation;
  });

  const nearbyPosts = posts.filter(post => 
    post.location && filterLocation && 
    post.location.toLowerCase().includes(filterLocation.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background py-12 animate-fade-in">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Warm Personal Greeting */}
        <div className="text-center mb-8 animate-scale-in">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to Your Community 💙
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Hey {profile?.full_name || 'Friend'}, how's your day going? 
            Want to share or explore something today?
          </p>
          
          {/* Conversation Starter */}
          {showStarter && (
            <Card className="max-w-2xl mx-auto mb-6 border-primary/20 bg-primary/5 animate-fade-in">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                    <p className="text-foreground font-medium">{currentStarter}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowStarter(false)}
                  >
                    ✕
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nearby Activity Suggestions */}
          {nearbyPosts.length > 0 && filterLocation && (
            <Card className="max-w-2xl mx-auto mb-6 border-accent/30 bg-accent/5 animate-slide-in-right">
              <CardContent className="pt-6">
                <p className="text-sm text-foreground">
                  🌍 <span className="font-semibold">{nearbyPosts.length}</span> people near you discussing{' '}
                  <span className="text-primary font-semibold">
                    {nearbyPosts[0]?.category}
                  </span> in {filterLocation}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {isAuthenticated && (
          <Card className="mb-8 shadow-lg hover:shadow-xl transition-all duration-300 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Share Your Story & Help Others
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your voice matters. Every experience shared helps someone feel less alone. 💪
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <Input
                  placeholder="Post Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
                <Textarea
                  placeholder="Share your story, ask for advice, or support others..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  maxLength={2000}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(cat => cat !== 'All').map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Location (optional)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full hover-scale">
                  {loading ? 'Sharing your story...' : '✨ Share with Community'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6 shadow-md border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Filter className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Find what matters to you:</span>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="🌍 Your location..."
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {filteredPosts.length === 0 ? (
            <Card className="shadow-md animate-fade-in">
              <CardContent className="py-16 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/50 animate-pulse" />
                <p className="text-lg text-muted-foreground mb-2">
                  {isAuthenticated 
                    ? 'No posts yet. Be the brave first voice! 💙' 
                    : 'Join us to see stories & support your community! 🌟'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post, index) => (
              <Card 
                key={post.id} 
                className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium">{post.profiles?.full_name || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                        {post.location && (
                          <>
                            <span>•</span>
                            <span>{post.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  
                  {/* Reaction Emojis */}
                  <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className="gap-2 hover-scale transition-all"
                    >
                      <Heart
                        className={`h-4 w-4 transition-all ${
                          post.post_likes.some(like => like.user_id === user?.id)
                            ? 'fill-red-500 text-red-500 scale-110'
                            : ''
                        }`}
                      />
                      <span className="font-medium">{post.post_likes.length}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span className="font-medium">{post.comments.length}</span>
                    </Button>
                    
                    {/* Thank Button */}
                    {isAuthenticated && post.user_id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleThankUser(post.profiles?.full_name || 'them')}
                        className="gap-2 hover-scale ml-auto"
                      >
                        <Handshake className="h-4 w-4 text-primary" />
                        <span className="text-primary font-medium">Thank Them 💝</span>
                      </Button>
                    )}
                  </div>
                  
                  {/* Typing Indicator */}
                  {typingUsers[post.id] && (
                    <div className="text-sm text-muted-foreground italic animate-pulse flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      {typingUsers[post.id]} is replying...
                    </div>
                  )}

                  {post.comments.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        💬 {post.comments.length} {post.comments.length === 1 ? 'supportive reply' : 'supportive replies'}
                      </p>
                      {post.comments.map((comment, idx) => (
                        <div 
                          key={comment.id} 
                          className="bg-gradient-to-r from-secondary/40 to-secondary/20 rounded-lg p-4 hover:shadow-md transition-all animate-fade-in"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-primary">
                                {comment.profiles?.full_name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {isAuthenticated && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Input
                        placeholder="💬 Share support, advice, or encouragement..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => {
                          setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }));
                          if (e.target.value.length > 2) {
                            simulateTyping(post.id, profile?.full_name || 'Someone');
                          }
                        }}
                        maxLength={500}
                        className="transition-all focus:ring-2 focus:ring-primary"
                      />
                      <Button
                        size="icon"
                        onClick={() => handleComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        className="hover-scale"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {!isAuthenticated && (
                    <div className="pt-4 border-t text-center">
                      <p className="text-sm text-muted-foreground">
                        💙 <Button variant="link" className="text-primary p-0">Login</Button> to join the conversation and support others
                      </p>
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
}
