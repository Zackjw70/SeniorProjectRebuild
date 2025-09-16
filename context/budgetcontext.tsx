import { supabase } from '@/database/lib/supabase';
import React, { createContext, useContext, useEffect, useState } from 'react';

type BudgetContextType = {
  budgetId: number;
  setBudgetId: (id: number) => void;
  roomcode: string;
  setRoomcode: (code: string) => void;
  refreshFlag: boolean;
  toggleRefresh: () => void;
};

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider = ({ children }: { children: React.ReactNode }) => {
  const [budgetId, setBudgetId] = useState(0);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [roomcode, setRoomcode] = useState('');

  const toggleRefresh = () => setRefreshFlag(prev => !prev);

  useEffect(() => {
    const fetchRoomcode = async () => {
      console.log('budgetId changed:', budgetId);

      if (budgetId > 0) {
        const { data } = await supabase
          .from('budgetoverview')
          .select('roomcode')
          .eq('budgetId', budgetId)
          .maybeSingle();

        if (data?.roomcode) {
          console.log('Fetched roomcode:', data.roomcode);
          setRoomcode(data.roomcode);
        }
      }
    };

    fetchRoomcode();
  }, [budgetId]);

  return (
    <BudgetContext.Provider value={{ budgetId, setBudgetId, refreshFlag, toggleRefresh, roomcode, setRoomcode }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) throw new Error('useBudget must be used within BudgetProvider');
  return context;
};

