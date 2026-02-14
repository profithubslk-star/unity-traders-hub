import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Subscription } from '../types/database.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscription: Subscription | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!error && data) {
      setSubscription(data as Subscription);
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      await fetchSubscription(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSubscription(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchSubscription(session.user.id);
        } else {
          setSubscription(null);
        }
      })();
    });

    return () => {
      authListener.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: data.user.id,
            plan_type: 'demo',
            status: 'active',
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (subError) {
          console.warn('Could not create demo subscription:', subError);
        }
      } catch (err) {
        console.warn('Error creating demo subscription:', err);
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscription(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        subscription,
        loading,
        signUp,
        signIn,
        signOut,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
