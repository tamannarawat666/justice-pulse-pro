-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID NOT NULL,
  message TEXT NOT NULL,
  read_status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Add parent_comment_id to comments table for threaded replies
ALTER TABLE public.comments
ADD COLUMN parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- Add attachment_url to posts table
ALTER TABLE public.posts
ADD COLUMN attachment_url TEXT;

-- Create storage bucket for forum attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-attachments', 'forum-attachments', true);

-- Storage policies for forum attachments
CREATE POLICY "Forum attachments are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'forum-attachments');

CREATE POLICY "Authenticated users can upload forum attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'forum-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own forum attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'forum-attachments' 
  AND auth.uid() IS NOT NULL
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to notify post author on new comment
CREATE OR REPLACE FUNCTION public.notify_post_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_author_id UUID;
  post_title TEXT;
BEGIN
  -- Get post author and title
  SELECT user_id, title INTO post_author_id, post_title
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Only notify if comment is not from the post author
  IF post_author_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, reference_id, message)
    VALUES (
      post_author_id,
      'comment',
      NEW.post_id,
      NEW.user_name || ' commented on your post: "' || post_title || '"'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_author();

-- Create function to notify comment author on reply
CREATE OR REPLACE FUNCTION public.notify_comment_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_author_id UUID;
BEGIN
  -- Only process if this is a reply to another comment
  IF NEW.parent_comment_id IS NOT NULL THEN
    -- Get parent comment author
    SELECT user_id INTO parent_author_id
    FROM public.comments
    WHERE id = NEW.parent_comment_id;
    
    -- Only notify if reply is not from the comment author
    IF parent_author_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, reference_id, message)
      VALUES (
        parent_author_id,
        'reply',
        NEW.post_id,
        NEW.user_name || ' replied to your comment'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for comment replies
DROP TRIGGER IF EXISTS on_comment_reply_created ON public.comments;
CREATE TRIGGER on_comment_reply_created
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_comment_reply();