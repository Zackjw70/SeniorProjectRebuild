import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/database/lib/supabase';

type AuthContextType = {
  user: any;
  setUser: (user: any) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const loadUser = async () => {
      const sessionString = await AsyncStorage.getItem('user');
      if (sessionString) {
        setUser(JSON.parse(sessionString));
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const updateUser = async (newUser: any) => {
    setUser(newUser);
    if (newUser) {
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } else {
      await AsyncStorage.removeItem('user');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut(); 
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser: updateUser, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
