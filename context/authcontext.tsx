import React, { createContext, useContext, useState } from 'react';
import { PostgrestSingleResponse } from '@supabase/supabase-js';
import { supabase } from '@/database/lib/supabase';

type CustomUser = {
  userid: number;
  email: string;
  username: string;
};

type AuthContextType = {
  user: CustomUser | null;
  setUser: (user: CustomUser | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<CustomUser | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
