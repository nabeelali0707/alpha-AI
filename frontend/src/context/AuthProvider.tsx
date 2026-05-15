"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const AuthContext = createContext<{ user: any; supabase: typeof supabase } | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // initial
    (async () => {
      const {
        data: { user: current }
      } = await supabase.auth.getUser();
      setUser(current ?? null);
    })();

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, supabase }}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
