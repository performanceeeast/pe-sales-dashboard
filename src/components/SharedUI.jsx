import React, { useState, useEffect } from 'react';
import { subscribeSaveStatus } from '../lib/storage';

/* ── Save Status Indicator (header pill) ── */
export function SaveStatusIndicator() {
  const [status, setStatus] = useState({ state: 'idle', message: '', strippedColumns: [] });
  const [open, setOpen] = useState(false);
  useEffect(() => subscribeSaveStatus(setStatus), []);
  const config = {
    idle:    { dot: '#94a3b8', bg: '#f1f5f9', label: 'IDLE',    text: 'No saves yet' },
    saving:  { dot: '#0284c7', bg: '#e0f2fe', label: 'SAVING',  text: 'Writing to server…' },
    saved:   { dot: '#16a34a', bg: '#dcfce7', label: 'SAVED',   text: 'All data persisted' },
    partial: { dot: '#d97706', bg: '#fef3c7', label: 'PARTIAL', text: 'Some fields skipped — schema missing column(s)' },
    error:   { dot: '#b91c1c', bg: '#fee2e2', label: 'ERROR',   text: 'Save failed — data is in browser cache only' },
  };
  const c = config[status.state] || config.idle;
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} title={status.message || c.text} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
        borderRadius: 14, border: 'none', cursor: 'pointer',
        background: c.bg, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700,
        color: c.dot, letterSpacing: 0.5, transition: 'all .15s',
      }}>
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          background: c.dot, animation: status.state === 'saving' ? 'pulse 1s ease infinite' : 'none',
        }} />
        {c.label}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          background: 'var(--card-bg)', border: '1px solid var(--border-primary)',
          borderRadius: 8, padding: 14, minWidth: 280, maxWidth: 360,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 1100,
          fontFamily: "'Outfit', sans-serif", fontSize: 11, color: 'var(--text-primary)',
        }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 11, fontWeight: 700, color: c.dot, letterSpacing: 1, marginBottom: 6 }}>{c.label}</div>
          <div style={{ fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>{status.message || c.text}</div>
          {status.lastSavedAt && (
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 8 }}>
              Last save: {new Date(status.lastSavedAt).toLocaleString()}
            </div>
          )}
          {status.strippedColumns && status.strippedColumns.length > 0 && (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 4, padding: 8, marginTop: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>MISSING SUPABASE COLUMNS</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#92400e', lineHeight: 1.5 }}>
                {status.strippedColumns.join(', ')}
              </div>
              <div style={{ fontSize: 9, color: '#92400e', marginTop: 6, lineHeight: 1.4 }}>
                Run the SQL setup script in Supabase to add these columns and enable full persistence. Data is currently stored in your browser only.
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button onClick={() => setOpen(false)} style={{
              background: 'none', border: '1px solid var(--border-primary)', borderRadius: 4,
              padding: '4px 10px', fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700,
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}>CLOSE</button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

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
