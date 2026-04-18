import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/supabase';
import type { CurrentUser } from '@/types';

interface AuthContextType {
  currentUser: CurrentUser;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          uid: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
          photoURL: session.user.user_metadata?.avatar_url || null,
        } as any);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          uid: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
          photoURL: session.user.user_metadata?.avatar_url || null,
        } as any);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    loading,
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#e0e5ec]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#babecc] border-t-[#ff4757]" />
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#4a5568]">Initializing System…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};