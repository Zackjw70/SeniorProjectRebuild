import React, { createContext, useContext, useState } from 'react';

type BudgetContextType = {
  budgetId: number;
  setBudgetId: (id: number) => void;
  refreshFlag: boolean;
  toggleRefresh: () => void;
};

const BudgetContext = createContext<BudgetContextType>({
  budgetId: 0,
  setBudgetId: () => {},
  refreshFlag: false,
  toggleRefresh: () => {},
});

export const BudgetProvider = ({ children }: { children: React.ReactNode }) => {
  const [budgetId, setBudgetId] = useState(0);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const toggleRefresh = () => setRefreshFlag(prev => !prev);

  return (
    <BudgetContext.Provider value={{ budgetId, setBudgetId, refreshFlag, toggleRefresh }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => useContext(BudgetContext);
