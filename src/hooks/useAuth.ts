import { useState, useEffect } from 'react';
import type { User as AppUser } from '../types';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: AppUser | null;
  loading: boolean;
}

export function useAuth(): AuthState & {
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState({
          user: mapUser(session.user),
          loading: false,
        });
      } else {
        setState({ user: null, loading: false });
      }
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          user: session?.user ? mapUser(session.user) : null,
          loading: false,
        });
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signUp(
    email: string,
    password: string,
    fullName?: string
  ): Promise<void> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  }

  async function signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return { ...state, signUp, signIn, signOut };
}

function mapUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, string>; created_at?: string }): AppUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    full_name: supabaseUser.user_metadata?.full_name,
    avatar_url: supabaseUser.user_metadata?.avatar_url,
    created_at: supabaseUser.created_at ?? new Date().toISOString(),
  };
}
