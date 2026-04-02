import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const THEME_KEY = 'peg-theme';

const lightVars = {
  '--bg-primary': '#f1f5f9',
  '--bg-secondary': '#ffffff',
  '--bg-tertiary': '#f8fafc',
  '--bg-inset': '#f1f5f9',
  '--card-bg': '#ffffff',
  '--card-hover': '#f8fafc',
  '--modal-bg': '#ffffff',
  '--modal-overlay': 'rgba(0,0,0,.4)',
  '--header-bg': '#ffffff',
  '--header-border': '#b91c1c',
  '--brand-red': '#b91c1c',
  '--brand-red-hover': '#991b1b',
  '--brand-red-soft': 'rgba(185,28,28,.08)',
  '--text-primary': '#1e293b',
  '--text-secondary': '#64748b',
  '--text-muted': '#94a3b8',
  '--text-inverse': '#ffffff',
  '--border-primary': '#e2e8f0',
  '--border-secondary': '#f1f5f9',
  '--border-accent': '#b91c1c',
  '--shadow-sm': '0 1px 3px rgba(0,0,0,.06)',
  '--shadow-md': '0 4px 12px rgba(0,0,0,.08)',
  '--shadow-lg': '0 20px 60px rgba(0,0,0,.18)',
  '--progress-bg': '#f1f5f9',
  '--scrollbar-track': '#f1f5f9',
  '--scrollbar-thumb': '#cbd5e1',
  '--scrollbar-hover': '#94a3b8',
  '--badge-bg': '#f1f5f9',
  '--input-bg': '#f8fafc',
  '--input-border': '#e2e8f0',
  '--tab-bg': '#f1f5f9',
  '--tab-active-bg': '#b91c1c',
  '--tab-active-text': '#ffffff',
  '--tab-text': '#64748b',
  '--row-alt': '#f8fafc',
  '--row-hover': '#f1f5f9',
  '--divider': '#e2e8f0',
};

const darkVars = {
  '--bg-primary': '#0f172a',
  '--bg-secondary': '#1e293b',
  '--bg-tertiary': '#1a2332',
  '--bg-inset': '#0f172a',
  '--card-bg': '#1e293b',
  '--card-hover': '#263548',
  '--modal-bg': '#1e293b',
  '--modal-overlay': 'rgba(0,0,0,.65)',
  '--header-bg': '#1e293b',
  '--header-border': '#dc2626',
  '--brand-red': '#dc2626',
  '--brand-red-hover': '#ef4444',
  '--brand-red-soft': 'rgba(220,38,38,.12)',
  '--text-primary': '#e2e8f0',
  '--text-secondary': '#94a3b8',
  '--text-muted': '#64748b',
  '--text-inverse': '#ffffff',
  '--border-primary': '#334155',
  '--border-secondary': '#1e293b',
  '--border-accent': '#dc2626',
  '--shadow-sm': '0 1px 3px rgba(0,0,0,.3)',
  '--shadow-md': '0 4px 12px rgba(0,0,0,.4)',
  '--shadow-lg': '0 20px 60px rgba(0,0,0,.5)',
  '--progress-bg': '#334155',
  '--scrollbar-track': '#1e293b',
  '--scrollbar-thumb': '#475569',
  '--scrollbar-hover': '#64748b',
  '--badge-bg': '#334155',
  '--input-bg': '#0f172a',
  '--input-border': '#334155',
  '--tab-bg': '#0f172a',
  '--tab-active-bg': '#dc2626',
  '--tab-active-text': '#ffffff',
  '--tab-text': '#94a3b8',
  '--row-alt': '#1a2332',
  '--row-hover': '#263548',
  '--divider': '#334155',
};

function applyTheme(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) === 'dark'; } catch { return false; }
  });
  const [storeBranding, setStoreBranding] = useState(null);

  useEffect(() => {
    const base = isDark ? { ...darkVars } : { ...lightVars };
    // Apply store-specific brand colors on top of base theme
    if (storeBranding) {
      const brand = isDark ? storeBranding.brand_dark || storeBranding.brand_primary : storeBranding.brand_primary;
      const brandHover = isDark ? storeBranding.brand_dark_hover || storeBranding.brand_primary_hover : storeBranding.brand_primary_hover;
      const brandSoft = isDark ? storeBranding.brand_dark_soft || storeBranding.brand_primary_soft : storeBranding.brand_primary_soft;
      if (brand) {
        base['--brand-red'] = brand;
        base['--header-border'] = brand;
        base['--border-accent'] = brand;
        base['--tab-active-bg'] = brand;
      }
      if (brandHover) base['--brand-red-hover'] = brandHover;
      if (brandSoft) base['--brand-red-soft'] = brandSoft;
    }
    applyTheme(base);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    try { localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light'); } catch {}
  }, [isDark, storeBranding]);

  const toggleTheme = () => setIsDark((d) => !d);

  // Called by StoreContext when store changes
  const applyStoreBranding = (storeTheme) => {
    setStoreBranding(storeTheme || null);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, applyStoreBranding }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
