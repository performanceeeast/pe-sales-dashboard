import React, { useState, useEffect } from 'react';
import { loadUsers, authenticate } from '../lib/storage';
import { ROLES } from '../lib/auth';
import { styles, FM, FH, FB } from './SharedUI';

const { input: inp, btn1: b1 } = styles;

export default function LoginScreen({ onLogin, storeId, storeTheme, onChangeStore }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await loadUsers(storeId);
      setUsers(u);
      setUsersLoading(false);
    })();
  }, [storeId]);

  async function handleLogin() {
    if (!selectedUser) { setError('Select your name'); return; }
    if (pin.length !== 4) { setError('Enter 4-digit PIN'); return; }
    setLoggingIn(true);
    const user = await authenticate(selectedUser, pin);
    setLoggingIn(false);
    if (user) {
      setError('');
      onLogin(user);
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  }

  return (
    <div style={{ fontFamily: FB, background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 32, width: 340, border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={storeTheme?.logo || '/logo.png'} alt="Performance East" style={{ height: 50, marginBottom: 12 }} />
          <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>SALES PORTAL</div>
          {onChangeStore && (
            <button onClick={onChangeStore} style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, textDecoration: 'underline' }}>Change Store</button>
          )}
        </div>

        {usersLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid var(--border-primary)', borderTopColor: 'var(--brand-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
            <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>CONNECTING...</div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>SELECT YOUR NAME</label>
              <select
                value={selectedUser}
                onChange={(e) => { setSelectedUser(e.target.value); setError(''); }}
                style={{ ...inp, fontSize: 13, padding: '10px 12px' }}
              >
                <option value="">— Select —</option>
                {users.filter((u) => u.active !== false).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({ROLES[u.role]?.label || u.role})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 4 }}>ENTER PIN</label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').substring(0, 4)); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={{ ...inp, fontSize: 24, textAlign: 'center', letterSpacing: 12, padding: '12px' }}
                placeholder="- - - -"
              />
            </div>

            {error && (
              <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--brand-red)', textAlign: 'center', marginBottom: 12, background: '#fef2f2', padding: '6px 12px', borderRadius: 4 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loggingIn}
              style={{ ...b1, width: '100%', padding: '12px', fontSize: 13, letterSpacing: 1, opacity: loggingIn ? 0.6 : 1 }}
            >
              {loggingIn ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  SIGNING IN...
                </span>
              ) : 'SIGN IN'}
            </button>
          </>
        )}

        <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, letterSpacing: 1 }}>
          PERFORMANCE EAST INC · GOLDSBORO, NC
        </div>
      </div>
    </div>
  );
}
