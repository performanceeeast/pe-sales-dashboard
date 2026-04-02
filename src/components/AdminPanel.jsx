import React, { useState, useEffect } from 'react';
import { loadStoreUsers, saveOneUser, deleteUser, migrateFromLocalStorage } from '../lib/storage';
import { ROLES, getRolesForStore } from '../lib/auth';
import { styles, FM, FH } from './SharedUI';
import { useStore } from '../contexts/StoreContext';

const { card, cardHead: cH, input: inp, btn1: b1, btn2: b2, th: TH, td: TD } = styles;

export default function AdminPanel({ storeId, storeConfig }) {
  const { stores } = useStore();
  const storeRoles = storeConfig ? getRolesForStore(storeConfig) : ROLES;
  const [newStore, setNewStore] = useState(storeId || 'goldsboro');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('salesperson');
  const [newPin, setNewPin] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPin, setEditPin] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);

  async function refresh() {
    setLoading(true);
    const u = await loadStoreUsers(storeId);
    setUsers(u);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, [storeId]);

  async function handleUpdateUser(user) {
    await saveOneUser(user);
    await refresh();
  }

  async function handleDeleteUser(id) {
    await deleteUser(id);
    await refresh();
  }

  async function addUser() {
    if (!newName.trim() || !newPin || newPin.length !== 4) return;
    const id = newName.trim().toLowerCase().split(' ')[0] + '_' + Date.now().toString().slice(-4);
    const newUser = { id, name: newName.trim(), role: newRole, pin: newPin, active: true, store_id: newStore };
    await saveOneUser(newUser, true);
    setNewName(''); setNewPin(''); setNewRole('salesperson'); setNewStore(storeId || 'goldsboro');
    await refresh();
  }

  async function handleMigrate() {
    if (!confirm('This will copy all data from localStorage to Supabase. Existing Supabase data will be overwritten for matching months. Continue?')) return;
    setMigrating(true);
    const result = await migrateFromLocalStorage();
    setMigrateResult(result);
    setMigrating(false);
  }

  if (loading) return <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)', padding: 20 }}>Loading users...</div>;

  return (
    <div>
      {/* ═══ USER MANAGEMENT ═══ */}
      <div style={card}>
        <div style={cH}>USER MANAGEMENT</div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Name', 'Role', 'PIN', 'Status', ''].map((h) => <th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ ...TD, fontFamily: FH, fontWeight: 600 }}>{u.name}</td>
                  <td style={TD}>
                    <select value={u.role} onChange={(e) => handleUpdateUser({ ...u, role: e.target.value })} style={{ ...inp, width: 'auto', padding: '3px 6px', fontSize: 10 }}>
                      {Object.entries(storeRoles).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td style={TD}>
                    {editingId === u.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input value={editPin} onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').substring(0, 4))} maxLength={4} style={{ ...inp, width: 60, textAlign: 'center', letterSpacing: 3, fontSize: 11 }} placeholder="0000" />
                        <button onClick={() => { handleUpdateUser({ ...u, pin: editPin }); setEditingId(null); setEditPin(''); }} style={{ ...b2, padding: '2px 8px', fontSize: 9 }}>SET</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(u.id); setEditPin(u.pin); }} style={{ ...b2, padding: '2px 8px', fontSize: 9 }}>CHANGE</button>
                    )}
                  </td>
                  <td style={TD}>
                    <button onClick={() => handleUpdateUser({ ...u, active: u.active === false ? true : false })} style={{
                      background: u.active !== false ? '#dcfce7' : '#fef2f2', border: 'none', borderRadius: 3, padding: '2px 8px',
                      cursor: 'pointer', fontFamily: FM, fontSize: 9, fontWeight: 700, color: u.active !== false ? '#16a34a' : '#b91c1c',
                    }}>{u.active !== false ? 'ACTIVE' : 'INACTIVE'}</button>
                  </td>
                  <td style={TD}>
                    <button onClick={() => { if (confirm(`Remove ${u.name}?`)) handleDeleteUser(u.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Add user */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border-primary)' }}>
          <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>ADD NEW USER</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>NAME</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} style={inp} placeholder="First Last" />
            </div>
            <div style={{ minWidth: 110 }}>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>ROLE</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} style={inp}>
                {Object.entries(storeRoles).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ minWidth: 70 }}>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>PIN</label>
              <input value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').substring(0, 4))} style={{ ...inp, textAlign: 'center', letterSpacing: 4 }} maxLength={4} placeholder="0000" />
            </div>
            <div style={{ minWidth: 120 }}>
              <label style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 3 }}>STORE</label>
              <select value={newStore} onChange={(e) => setNewStore(e.target.value)} style={inp}>
                {stores.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.short_name || s.name}</option>)}
              </select>
            </div>
            <button onClick={addUser} style={{ ...b1, padding: '8px 16px' }}>ADD USER</button>
          </div>
        </div>
      </div>

      {/* ═══ DATA MIGRATION ═══ */}
      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ ...cH, background: '#fefce8', borderBottomColor: '#fde68a' }}>
          <span style={{ color: '#d97706' }}>MIGRATE LOCAL DATA TO SUPABASE</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
            IF YOU HAVE EXISTING DATA IN YOUR BROWSER FROM THE OLD VERSION, CLICK BELOW TO COPY IT TO SUPABASE. THIS ONLY NEEDS TO BE DONE ONCE.
          </div>
          <button onClick={handleMigrate} disabled={migrating} style={{ ...b1, background: '#d97706', padding: '10px 20px', opacity: migrating ? 0.6 : 1 }}>
            {migrating ? 'MIGRATING...' : 'MIGRATE LOCALSTORAGE → SUPABASE'}
          </button>
          {migrateResult && (
            <div style={{ fontFamily: FM, fontSize: 11, color: '#16a34a', marginTop: 10, background: '#f0fdf4', padding: '8px 12px', borderRadius: 4 }}>
              Migration complete: {migrateResult.months} months + {migrateResult.users} users transferred.
            </div>
          )}
        </div>
      </div>

      {/* ═══ DATA BACKUP ═══ */}
      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ ...cH, background: '#f0f9ff', borderBottomColor: '#bae6fd' }}>
          <span style={{ color: '#0284c7' }}>DATA BACKUP</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
            DATA IS NOW STORED IN SUPABASE (CLOUD). LOCAL BACKUP IS OPTIONAL BUT RECOMMENDED.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => {
              const allData = {};
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('peg-')) {
                  try { allData[key] = JSON.parse(localStorage.getItem(key)); } catch { allData[key] = localStorage.getItem(key); }
                }
              }
              const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `pe-sales-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }} style={{ ...b1, background: '#0284c7', padding: '10px 20px' }}>
              EXPORT LOCAL CACHE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
