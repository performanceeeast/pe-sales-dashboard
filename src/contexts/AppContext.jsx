import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [navigationContext, setNavigationContext] = useState(null);

  // Navigate to a specific customer in CRM
  const navigateToCustomer = useCallback((customerId, setView) => {
    setNavigationContext({ type: 'customer', id: customerId });
    setView('crm');
  }, []);

  // Navigate to a specific deal
  const navigateToDeal = useCallback((dealId, setView) => {
    setNavigationContext({ type: 'deal', id: dealId });
    setView('deals');
  }, []);

  // Navigate to a tab with optional context
  const navigateToTab = useCallback((tab, context, setView) => {
    if (context) setNavigationContext(context);
    setView(tab);
  }, []);

  // Clear navigation context after it's been consumed
  const clearNavigationContext = useCallback(() => {
    setNavigationContext(null);
  }, []);

  return (
    <AppContext.Provider value={{
      navigationContext,
      setNavigationContext,
      navigateToCustomer,
      navigateToDeal,
      navigateToTab,
      clearNavigationContext,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppProvider');
  return ctx;
}
