import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from './ThemeContext';

const StoreContext = createContext();
const STORE_KEY = 'peg-selected-store';

// Hardcoded store configs as fallback (in case Supabase stores table doesn't exist yet)
const FALLBACK_STORES = [
  {
    id: 'goldsboro',
    name: 'Performance East - Goldsboro',
    short_name: 'Goldsboro',
    location: 'Goldsboro, NC',
    config: {
      unit_types: ['ATV', 'SXS', 'PWC', 'BOAT', 'TRAILER', 'YOUTH'],
      back_end_products: ['EXTENDED WARRANTY', 'LIFETIME OIL CHANGE', 'GAP', 'LIFETIME BATTERY'],
      has_ism: true,
      default_goals: {
        ATV: { target: 40, stretch: 45, payout: 250, stretchPayout: 500 },
        SXS: { target: 45, stretch: 50, payout: 250, stretchPayout: 500 },
        PWC: { target: 12, stretch: 14, payout: 400, stretchPayout: 800 },
        BOAT: { target: 12, stretch: 14, payout: 400, stretchPayout: 800 },
        TRAILER: { target: 15, stretch: 17, payout: 300, stretchPayout: 600 },
        YOUTH: { target: 10, stretch: 12, payout: 200, stretchPayout: 400 },
      },
    },
    theme: {
      brand_primary: '#b91c1c',
      brand_primary_hover: '#991b1b',
      brand_primary_soft: 'rgba(185,28,28,.08)',
      brand_dark: '#dc2626',
      brand_dark_hover: '#ef4444',
      brand_dark_soft: 'rgba(220,38,38,.12)',
      logo: '/logo.png',
      footer: 'PERFORMANCE EAST INC \u00B7 SALES PORTAL \u00B7 GOLDSBORO, NC',
    },
    active: true,
  },
  {
    id: 'cedar_point',
    name: 'Performance East - Cedar Point',
    short_name: 'Cedar Point',
    location: 'Cedar Point, NC',
    config: {
      unit_types: ['BOAT', 'ENGINE REPOWER', 'TRAILER'],
      back_end_products: ['EXTENDED WARRANTY', 'VIP SERVICE PLAN', 'LIFETIME SERVICE PLAN', 'GAP', 'GELCOAT PROTECTION', 'LIFETIME BATTERY'],
      has_ism: false,
      default_goals: {
        BOAT: { target: 15, stretch: 18, payout: 400, stretchPayout: 800 },
        'ENGINE REPOWER': { target: 8, stretch: 10, payout: 300, stretchPayout: 600 },
        TRAILER: { target: 10, stretch: 12, payout: 200, stretchPayout: 400 },
      },
    },
    theme: {
      brand_primary: '#1e3a5f',
      brand_primary_hover: '#15304f',
      brand_primary_soft: 'rgba(30,58,95,.08)',
      brand_dark: '#2563eb',
      brand_dark_hover: '#3b82f6',
      brand_dark_soft: 'rgba(37,99,235,.12)',
      logo: '/logo-cedarpoint.png',
      footer: 'PERFORMANCE EAST \u00B7 CEDAR POINT MARINE \u00B7 CEDAR POINT, NC',
    },
    active: true,
  },
];

export function StoreProvider({ children }) {
  const { applyStoreBranding } = useTheme();
  const [stores, setStores] = useState(FALLBACK_STORES);
  const [currentStore, setCurrentStore] = useState(null);

  // Load stores from Supabase (or use fallback)
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('active', true)
          .order('name');
        if (!error && data && data.length > 0) {
          setStores(data);
        }
      } catch {
        // Use fallback stores
      }

      // Restore saved store selection
      try {
        const savedId = localStorage.getItem(STORE_KEY);
        if (savedId) {
          const found = FALLBACK_STORES.find((s) => s.id === savedId);
          if (found) setCurrentStore(found);
        }
      } catch {}
    })();
  }, []);

  // Re-resolve currentStore when stores load from Supabase
  useEffect(() => {
    if (currentStore && stores.length > 0) {
      const fresh = stores.find((s) => s.id === currentStore.id);
      if (fresh && fresh !== currentStore) setCurrentStore(fresh);
    }
  }, [stores]);

  // Apply store branding when store changes
  useEffect(() => {
    if (currentStore?.theme) {
      applyStoreBranding(currentStore.theme);
    }
  }, [currentStore, applyStoreBranding]);

  const setStore = useCallback((storeId) => {
    const store = stores.find((s) => s.id === storeId);
    if (store) {
      setCurrentStore(store);
      try { localStorage.setItem(STORE_KEY, storeId); } catch {}
    }
  }, [stores]);

  const clearStore = useCallback(() => {
    setCurrentStore(null);
    try { localStorage.removeItem(STORE_KEY); } catch {}
  }, []);

  // Derived config helpers
  const storeId = currentStore?.id || null;
  const storeConfig = currentStore?.config || FALLBACK_STORES[0].config;
  const storeTheme = currentStore?.theme || FALLBACK_STORES[0].theme;

  return (
    <StoreContext.Provider value={{
      stores,
      currentStore,
      storeId,
      storeConfig,
      storeTheme,
      setStore,
      clearStore,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}
