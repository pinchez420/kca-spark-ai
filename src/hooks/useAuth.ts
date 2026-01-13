import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata: {
    full_name: string;
    role: 'student' | 'lecturer' | 'admin';
    campus_id?: string;
  }) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      console.log('[Auth] Starting signup for:', email);
      console.log('[Auth] Metadata:', metadata);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        }
      });

      console.log('[Auth] SignUp response:', { data, error });

      if (error) {
        console.error('[Auth] SignUp error:', error);
        
        // Handle specific Supabase error codes
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          toast({
            title: "Connection Error",
            description: "Unable to connect to Supabase. Please check your internet connection and try again.",
            variant: "destructive",
          });
          return { data: null, error };
        }
        
        // Handle email already registered
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          toast({
            title: "Email Already Registered",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
          return { data: null, error };
        }
        
        // Show full error for debugging
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // Check if email confirmation is required
      if (data.session === null && data.user !== null) {
        // User was created but needs to confirm email
        toast({
          title: "Check your email!",
          description: "We've sent a confirmation link to your email. Please verify your email to complete registration.",
          variant: "default",
        });
        return { 
          data, 
          error: null,
          needsEmailConfirmation: true 
        };
      }

      // User is automatically signed in (email confirmation disabled)
      toast({
        title: "Account created!",
        description: "Welcome to KCA Connect AI!",
      });

      return { data, error: null, needsEmailConfirmation: false };
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Handle network errors
      if (error.message?.includes('Failed to fetch') || error.message?.includes('network') || !navigator.onLine) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign up failed",
          description: error.message || "An error occurred during sign up",
          variant: "destructive",
        });
      }
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred during sign out",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
};
