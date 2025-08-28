"use client";

import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

interface SessionContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: React.ReactNode;
  initialSession?: Session | null;
}

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(initialSession || null);
  const [user, setUser] = useState<User | null>(initialSession?.user || null);
  const [isLoading, setIsLoading] = useState(!initialSession);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    // If we don't have an initial session, get it
    if (!initialSession) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user || null);
          setIsLoading(false);
        }
      });
    } else {
      setIsLoading(false);
    }

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user || null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initialSession, supabase]);

  return (
    <SessionContext.Provider value={{ user, session, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}