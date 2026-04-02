import React from 'react';
import { useStore } from '../contexts/StoreContext';
import { FM, FH, FB } from './SharedUI';

export default function StorePickerScreen() {
  const { stores, setStore } = useStore();

  return (
    <div style={{
      fontFamily: FB, background: 'var(--bg-primary)', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 600, width: '100%' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: FH, fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 2, marginBottom: 6 }}>
            PERFORMANCE EAST
          </div>
          <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)', letterSpacing: 3 }}>
            SALES PORTAL
          </div>
        </div>

        <div style={{ fontFamily: FM, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 24 }}>
          SELECT YOUR STORE LOCATION
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {stores.filter((s) => s.active).map((store) => {
            const theme = store.theme || {};
            const brandColor = theme.brand_primary || '#b91c1c';

            return (
              <button
                key={store.id}
                onClick={() => setStore(store.id)}
                style={{
                  background: 'var(--card-bg)',
                  border: `2px solid ${brandColor}`,
                  borderRadius: 12,
                  padding: '28px 32px',
                  cursor: 'pointer',
                  minWidth: 220,
                  maxWidth: 260,
                  flex: 1,
                  transition: 'all .2s ease',
                  boxShadow: 'var(--shadow-md)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  e.currentTarget.style.background = brandColor + '10';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.background = 'var(--card-bg)';
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <img
                    src={theme.logo || '/logo.png'}
                    alt={store.name}
                    style={{ height: 48, objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div style={{
                  fontFamily: FH, fontSize: 16, fontWeight: 700, color: brandColor,
                  letterSpacing: 1, marginBottom: 6,
                }}>
                  {store.short_name || store.name}
                </div>
                <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
                  {store.location}
                </div>
                <div style={{
                  marginTop: 14, padding: '6px 16px', borderRadius: 6,
                  background: brandColor, color: '#fff',
                  fontFamily: FH, fontSize: 10, fontWeight: 600, letterSpacing: 1,
                  display: 'inline-block',
                }}>
                  ENTER
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', marginTop: 32, letterSpacing: 1 }}>
          PERFORMANCE EAST INC
        </div>
      </div>
    </div>
  );
}
