import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Refs to prevent duplicate calls (React 18 StrictMode safe)
  const isAuthenticating = useRef(false);
  const initializationRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initializationRef.current) return;
    initializationRef.current = true;

    // Set up auth state listener FIRST (before checking session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!.split('@')[0]
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!.split('@')[0]
        });
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Prevent duplicate calls
    if (isAuthenticating.current) {
      console.log('Login already in progress, skipping...');
      return false;
    }

    isAuthenticating.current = true;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Don't setUser here - let onAuthStateChange handle it
      return true;
    } finally {
      isAuthenticating.current = false;
    }
  }, [toast]);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    // Prevent duplicate calls
    if (isAuthenticating.current) {
      console.log('Signup already in progress, skipping...');
      return false;
    }

    isAuthenticating.current = true;

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Don't setUser here - let onAuthStateChange handle it
      toast({
        title: "Welcome! 🎉",
        description: "Your account has been created successfully.",
      });
      return true;
    } finally {
      isAuthenticating.current = false;
    }
  }, [toast]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // Don't setUser(null) here - let onAuthStateChange handle it
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};