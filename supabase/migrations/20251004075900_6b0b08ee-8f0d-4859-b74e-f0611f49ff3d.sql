-- Create court hearings table
CREATE TABLE IF NOT EXISTS public.court_hearings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_name TEXT NOT NULL,
  court_date TIMESTAMPTZ NOT NULL,
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.court_hearings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own hearings" 
ON public.court_hearings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hearings" 
ON public.court_hearings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hearings" 
ON public.court_hearings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hearings" 
ON public.court_hearings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_court_hearings_updated_at
BEFORE UPDATE ON public.court_hearings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_court_hearings_user_id ON public.court_hearings(user_id);
CREATE INDEX idx_court_hearings_court_date ON public.court_hearings(court_date);