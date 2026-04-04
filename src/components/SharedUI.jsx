import React, { useState, useEffect } from 'react';

/* ── Font references ── */
export const FM = "'DM Mono', monospace";
export const FH = "'Oswald', sans-serif";
export const FB = "'Outfit', sans-serif";

/* ── Shared styles (CSS variable backed) ── */
export const styles = {
  card: {
    background: 'var(--card-bg)',
    borderRadius: 10,
    border: '1px solid var(--border-primary)',
    overflow: 'hidden',
    transition: 'background-color .25s ease, border-color .25s ease, box-shadow .25s ease',
  },
  cardHead: {
    padding: '10px 16px',
    borderBottom: '1px solid var(--border-primary)',
    fontFamily: FH,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 1.5,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    background: 'var(--bg-tertiary)',
  },
  input: {
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: 6,
    padding: '8px 10px',
    color: 'var(--text-primary)',
    fontSize: 12,
    fontFamily: FB,
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color .15s ease, background-color .25s ease',
  },
  btn1: {
    background: 'var(--brand-red)',
    color: 'var(--text-inverse)',
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    fontFamily: FH,
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: 1,
    cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'background-color .15s ease, transform .1s ease',
  },
  btn2: {
    background: 'var(--badge-bg)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: 6,
    padding: '8px 16px',
    fontFamily: FH,
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: 1,
    cursor: 'pointer',
    textTransform: 'uppercase',
    transition: 'background-color .15s ease, border-color .15s ease',
  },
  th: {
    padding: '8px 10px',
    textAlign: 'left',
    fontSize: 9,
    fontWeight: 600,
    color: 'var(--text-muted)',
    fontFamily: FM,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    borderBottom: '2px solid var(--border-primary)',
    background: 'var(--bg-tertiary)',
  },
  td: {
    padding: '9px 10px',
    fontSize: 12,
    borderBottom: '1px solid var(--border-secondary)',
    fontFamily: FB,
    color: 'var(--text-primary)',
  },
  label: {
    fontFamily: FM,
    fontSize: 9,
    color: 'var(--text-muted)',
    letterSpacing: 1,
    display: 'block',
    marginBottom: 3,
  },
};

/* ── Tab transition wrapper ── */
export function TabTransition({ viewKey, children }) {
  const [active, setActive] = useState(false);
  const [currentKey, setCurrentKey] = useState(viewKey);

  useEffect(() => {
    if (viewKey !== currentKey) {
      setActive(false);
      const t = setTimeout(() => {
        setCurrentKey(viewKey);
        setActive(true);
      }, 80);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setActive(true), 20);
      return () => clearTimeout(t);
    }
  }, [viewKey, currentKey]);

  return (
    <div style={{
      opacity: active ? 1 : 0,
      transform: active ? 'translateY(0)' : 'translateY(4px)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
    }}>
      {children}
    </div>
  );
}

/* ── Modal ── */
export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'var(--modal-overlay)',
        zIndex: 1000, backdropFilter: 'blur(4px)', overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--modal-bg)', borderRadius: 12, padding: 24,
          maxWidth: wide ? 820 : 580, width: '94%', margin: '40px auto',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'modalIn .2s ease',
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 18, borderBottom: '2px solid var(--brand-red)', paddingBottom: 10,
        }}>
          <h3 style={{
            margin: 0, fontFamily: FH, fontSize: 16, fontWeight: 600,
            letterSpacing: 1, color: 'var(--text-primary)', textTransform: 'uppercase',
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Progress Bar ── */
export function ProgressBar({ value, max, color = 'var(--brand-red)' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ background: 'var(--progress-bg)', borderRadius: 4, height: 8, width: '100%', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s ease' }} />
    </div>
  );
}

/* ── Stat Card ── */
export function StatCard({ label, value, sub, accent = 'var(--brand-red)' }) {
  return (
    <div style={{ ...styles.card, flex: 1, minWidth: 120, textAlign: 'center', padding: '14px 10px' }}>
      <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: FH, fontSize: 28, fontWeight: 700, color: accent, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
