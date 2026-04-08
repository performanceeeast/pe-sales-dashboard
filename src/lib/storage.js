/**
 * Storage layer — Supabase primary, localStorage cache for offline.
 * All functions are async. Multi-store: storeId is first param where applicable.
 */
import { supabase } from './supabaseClient';

// ── Save Status Tracking ──
// Tracks the most recent save outcome so the UI can show a status indicator.
// Status values: 'idle' | 'saving' | 'saved' | 'error' | 'partial'
//   'partial' = save succeeded but had to strip unknown columns
let saveStatus = { state: 'idle', message: '', strippedColumns: [], lastSavedAt: null };
const saveStatusListeners = new Set();

export function getSaveStatus() { return { ...saveStatus }; }
export function subscribeSaveStatus(fn) {
  saveStatusListeners.add(fn);
  fn(saveStatus);
  return () => saveStatusListeners.delete(fn);
}
function setSaveStatus(next) {
  saveStatus = { ...saveStatus, ...next };
  saveStatusListeners.forEach((fn) => { try { fn(saveStatus); } catch {} });
}

// ── Monthly Data (goals, KPIs, checklists, etc.) ──

function readLocalMonth(storeId, year, month) {
  try {
    const key = storeId ? `peg-sales-${storeId}-${year}-${month}` : `peg-sales-${year}-${month}`;
    let raw = localStorage.getItem(key);
    if (!raw && storeId) raw = localStorage.getItem(`peg-sales-${year}-${month}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// Dedicated localStorage backup for the F&I menu config (products + packages + settings).
// This is kept SEPARATE from the monthly_data blob so it can't be accidentally overwritten
// by month switches or other data mutations. Keyed by storeId so each store has its own.
export function saveFiMenuConfigBackup(storeId, config) {
  if (!config) return;
  try {
    const key = `peg-fi-menu-config-${storeId || 'default'}`;
    localStorage.setItem(key, JSON.stringify({ config, savedAt: new Date().toISOString() }));
  } catch (e) { console.error('fi-menu-config backup write failed:', e); }
}

export function readFiMenuConfigBackup(storeId) {
  try {
    const key = `peg-fi-menu-config-${storeId || 'default'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.config ? parsed.config : null;
  } catch { return null; }
}

// Dedicated localStorage backup for finance menus (the saved menu records).
// Same store-level pattern as the F&I config backup. Survives month switches
// and protects against silent Supabase save failures.
export function saveFiMenusBackup(storeId, menus) {
  if (!Array.isArray(menus)) return;
  try {
    const key = `peg-fi-menus-${storeId || 'default'}`;
    localStorage.setItem(key, JSON.stringify({ menus, savedAt: new Date().toISOString() }));
  } catch (e) { console.error('fi-menus backup write failed:', e); }
}

export function readFiMenusBackup(storeId) {
  try {
    const key = `peg-fi-menus-${storeId || 'default'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.menus) ? parsed.menus : null;
  } catch { return null; }
}

// Load every saved finance menu for a store across every month in Supabase, deduped by id.
// Provides store-level fiMenus persistence so menus aren't trapped in the month they were saved in.
export async function loadAllFiMenusForStore(storeId) {
  try {
    let q = supabase.from('monthly_data').select('year,month,fi_menus');
    if (storeId) q = q.eq('store_id', storeId);
    const { data, error } = await q;
    if (error || !data) return [];
    const byId = new Map();
    data.forEach((row) => {
      const arr = Array.isArray(row.fi_menus) ? row.fi_menus : [];
      arr.forEach((m) => {
        if (!m || !m.id) return;
        const existing = byId.get(m.id);
        // Prefer the most recently updated copy
        if (!existing || (m.updatedAt || '') > (existing.updatedAt || '')) {
          byId.set(m.id, m);
        }
      });
    });
    return Array.from(byId.values());
  } catch (e) {
    console.error('loadAllFiMenusForStore error:', e);
    return [];
  }
}

// Deep scan: look at EVERY localStorage key AND query Supabase for every monthly row,
// return every fiMenuConfig we can find with its source. Used for data recovery when
// the user's catalog has been silently lost somewhere in the pipeline.
export async function scanAllFiMenuConfigs(storeId) {
  const results = [];

  // 1. Scan all localStorage keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        // peg-sales-<store>-<year>-<month>: monthly data blob
        if (key.startsWith('peg-sales-')) {
          const data = JSON.parse(raw);
          const fi = data && data.fiMenuConfig;
          if (fi && ((Array.isArray(fi.products) && fi.products.length > 0) || (Array.isArray(fi.packages) && fi.packages.length > 0))) {
            results.push({
              source: `localStorage: ${key}`,
              products: Array.isArray(fi.products) ? fi.products.length : 0,
              packages: Array.isArray(fi.packages) ? fi.packages.length : 0,
              config: fi,
            });
          }
        }
        // peg-fi-menu-config-<store>: dedicated backup
        if (key.startsWith('peg-fi-menu-config-')) {
          const parsed = JSON.parse(raw);
          const fi = parsed && parsed.config;
          if (fi && ((Array.isArray(fi.products) && fi.products.length > 0) || (Array.isArray(fi.packages) && fi.packages.length > 0))) {
            results.push({
              source: `backup: ${key}` + (parsed.savedAt ? ` (saved ${parsed.savedAt})` : ''),
              products: Array.isArray(fi.products) ? fi.products.length : 0,
              packages: Array.isArray(fi.packages) ? fi.packages.length : 0,
              config: fi,
            });
          }
        }
      } catch { /* ignore bad JSON */ }
    }
  } catch (e) { console.error('localStorage scan error:', e); }

  // 2. Query Supabase for all monthly_data rows and extract their fi_menu_config
  try {
    let q = supabase.from('monthly_data').select('store_id,year,month,fi_menu_config');
    if (storeId) q = q.eq('store_id', storeId);
    const { data, error } = await q;
    if (!error && data) {
      data.forEach((row) => {
        const fi = row.fi_menu_config;
        if (fi && ((Array.isArray(fi.products) && fi.products.length > 0) || (Array.isArray(fi.packages) && fi.packages.length > 0))) {
          results.push({
            source: `Supabase: ${row.store_id || 'default'} ${row.year}-${String(row.month + 1).padStart(2, '0')}`,
            products: Array.isArray(fi.products) ? fi.products.length : 0,
            packages: Array.isArray(fi.packages) ? fi.packages.length : 0,
            config: fi,
          });
        }
      });
    }
  } catch (e) { console.error('Supabase scan error:', e); }

  // Sort by total item count descending (most populated first)
  results.sort((a, b) => (b.products + b.packages) - (a.products + a.packages));
  return results;
}

// Merge local data into Supabase data when Supabase is missing populated fields.
// This protects against cases where a save to Supabase failed (e.g. unknown column)
// but the data was still written to localStorage — we don't want to lose it.
function mergeLocalIntoRemote(remote, local) {
  if (!local) return remote;
  if (!remote) return local;
  const merged = { ...remote };
  const keys = ['deals', 'leads', 'floorLeads', 'hitList', 'contests', 'notes', 'meetingNotes', 'fiMenus', 'fiDeals', 'promoRecords', 'pricingRecords', 'inventoryItems'];
  keys.forEach((k) => {
    const r = Array.isArray(remote[k]) ? remote[k] : null;
    const l = Array.isArray(local[k]) ? local[k] : null;
    if (l && (!r || l.length > r.length)) merged[k] = l;
  });
  // fiMenuConfig: prefer the version with more products
  // fiMenuConfig: prefer whichever side has more populated data.
  // The F&I product catalog is manually built by the user and represents
  // significant work — we aggressively preserve it.
  const rFi = remote.fiMenuConfig || {};
  const lFi = local.fiMenuConfig || {};
  const rProducts = Array.isArray(rFi.products) ? rFi.products : [];
  const lProducts = Array.isArray(lFi.products) ? lFi.products : [];
  const rPackages = Array.isArray(rFi.packages) ? rFi.packages : [];
  const lPackages = Array.isArray(lFi.packages) ? lFi.packages : [];

  // Deep merge: for each side, pick whichever has more items for products and packages
  // independently, then merge the rest of the config keys (local wins ties).
  const mergedFi = { ...rFi, ...lFi };
  mergedFi.products = lProducts.length >= rProducts.length ? lProducts : rProducts;
  mergedFi.packages = lPackages.length >= rPackages.length ? lPackages : rPackages;
  // Only set fiMenuConfig if at least one side has data
  if (Object.keys(mergedFi).length > 0) {
    merged.fiMenuConfig = mergedFi;
  }
  return merged;
}

// Load the most populated fi_menu_config for a store across all months in Supabase.
// Provides store-level F&I catalog persistence across browsers.
export async function loadLatestFiMenuConfigForStore(storeId) {
  try {
    let q = supabase.from('monthly_data').select('year,month,fi_menu_config');
    if (storeId) q = q.eq('store_id', storeId);
    const { data, error } = await q;
    if (error || !data) return null;
    let best = null;
    let bestScore = -1;
    data.forEach((row) => {
      const fi = row.fi_menu_config;
      if (!fi) return;
      const prods = Array.isArray(fi.products) ? fi.products.length : 0;
      const pkgs = Array.isArray(fi.packages) ? fi.packages.length : 0;
      const score = prods * 10 + pkgs;
      if (score > bestScore) {
        bestScore = score;
        best = fi;
      }
    });
    return best;
  } catch (e) {
    console.error('loadLatestFiMenuConfigForStore error:', e);
    return null;
  }
}

export async function loadMonth(storeId, year, month) {
  const local = readLocalMonth(storeId, year, month);
  const fiBackup = readFiMenuConfigBackup(storeId);
  const fiMenusBackup = readFiMenusBackup(storeId);

  // The F&I menu config is STORE-LEVEL (not per-month). Each store has its own catalog
  // that persists across all months. The dedicated store-keyed backup is the authoritative
  // source for fiMenuConfig whenever it has any data. This also ensures each store's
  // catalog is fully independent from other stores (backup keys include storeId).
  const applyFiBackup = (data) => {
    let out = data;
    if (fiBackup) {
      const hasBackupData = (Array.isArray(fiBackup.products) && fiBackup.products.length > 0)
        || (Array.isArray(fiBackup.packages) && fiBackup.packages.length > 0);
      if (hasBackupData) {
        out = { ...(out || {}), fiMenuConfig: fiBackup };
      }
    }
    // Same protection for the fiMenus list — if the backup has more menus than the
    // current data, prefer the backup. Dedupe by id with most-recently-updated winning.
    if (fiMenusBackup && fiMenusBackup.length > 0) {
      const current = (out && Array.isArray(out.fiMenus)) ? out.fiMenus : [];
      const byId = new Map();
      [...current, ...fiMenusBackup].forEach((m) => {
        if (!m || !m.id) return;
        const existing = byId.get(m.id);
        if (!existing || (m.updatedAt || '') > (existing.updatedAt || '')) {
          byId.set(m.id, m);
        }
      });
      const merged = Array.from(byId.values());
      if (merged.length > current.length) {
        out = { ...(out || {}), fiMenus: merged };
      }
    }
    return out;
  };

  try {
    let q = supabase.from('monthly_data').select('*').eq('year', year).eq('month', month);
    if (storeId) q = q.eq('store_id', storeId);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    if (data) {
      const remote = rowToMonthData(data);
      return applyFiBackup(mergeLocalIntoRemote(remote, local));
    }
    return applyFiBackup(local);
  } catch (e) {
    console.error('loadMonth error, falling back to localStorage:', e);
    return applyFiBackup(local);
  }
}

// List of fields that should be safe in newer schemas but may be missing in older ones.
// If an upsert fails with an unknown-column error, we strip these and retry.
const OPTIONAL_COLUMNS = ['deals', 'floor_leads', 'fi_menu_config', 'fi_menus', 'promo_records', 'pricing_records', 'inventory_items', 'gsm_bonus_config', 'history_counts', 'fi_checklist'];

export async function saveMonth(storeId, year, month, data) {
  setSaveStatus({ state: 'saving', message: 'Saving…' });
  // Always write localStorage FIRST (synchronous, never lost)
  const cacheKey = storeId ? `peg-sales-${storeId}-${year}-${month}` : `peg-sales-${year}-${month}`;
  try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) { console.error('localStorage write failed:', e); }

  // ALSO write the F&I menu config to its dedicated backup if it has any products or packages.
  // This creates a store-level backup that survives month switches and cache quirks.
  const fi = data && data.fiMenuConfig;
  if (fi && ((Array.isArray(fi.products) && fi.products.length > 0) || (Array.isArray(fi.packages) && fi.packages.length > 0))) {
    saveFiMenuConfigBackup(storeId, fi);
  }
  // Same protection for the saved finance menus list
  if (data && Array.isArray(data.fiMenus) && data.fiMenus.length > 0) {
    saveFiMenusBackup(storeId, data.fiMenus);
  }

  // Then write to Supabase (async, with retry for unknown columns)
  const row = monthDataToRow(year, month, data);
  if (storeId) row.store_id = storeId;
  const tryUpsert = async (r) => {
    const { error } = await supabase
      .from('monthly_data')
      .upsert(r, { onConflict: storeId ? 'store_id,year,month' : 'year,month' });
    return error;
  };
  const stripped = [];
  try {
    let err = await tryUpsert(row);
    let attempts = 0;
    while (err && attempts < OPTIONAL_COLUMNS.length) {
      const msg = (err.message || '').toLowerCase();
      if (!msg.includes('column') && !msg.includes('schema') && !msg.includes('does not exist')) break;
      let removedSomething = false;
      for (const col of OPTIONAL_COLUMNS) {
        if (msg.includes(col) && row[col] !== undefined) {
          delete row[col];
          stripped.push(col);
          removedSomething = true;
        }
      }
      if (!removedSomething) break;
      err = await tryUpsert(row);
      attempts++;
    }
    if (err) {
      console.error('saveMonth Supabase error (data safe in localStorage):', err);
      setSaveStatus({
        state: 'error',
        message: 'Save failed: ' + (err.message || 'Unknown error') + ' — Data is safe in browser cache. Click for details.',
        strippedColumns: stripped,
      });
      return;
    }
    if (stripped.length > 0) {
      setSaveStatus({
        state: 'partial',
        message: `Saved with ${stripped.length} field(s) skipped — schema missing: ${stripped.join(', ')}`,
        strippedColumns: stripped,
        lastSavedAt: new Date().toISOString(),
      });
    } else {
      setSaveStatus({ state: 'saved', message: 'All saved', strippedColumns: [], lastSavedAt: new Date().toISOString() });
    }
  } catch (e) {
    console.error('saveMonth Supabase error (data safe in localStorage):', e);
    setSaveStatus({
      state: 'error',
      message: 'Save failed: ' + (e.message || 'Unknown error') + ' — Data is safe in browser cache.',
      strippedColumns: stripped,
    });
  }
}

export async function loadYear(storeId, year) {
  try {
    let q = supabase.from('monthly_data').select('*').eq('year', year);
    if (storeId) q = q.eq('store_id', storeId);
    const { data, error } = await q.order('month');
    if (error) throw error;
    const months = Array(12).fill(null);
    (data || []).forEach((row) => { months[row.month] = rowToMonthData(row); });
    return months;
  } catch (e) {
    console.error('loadYear error, falling back to localStorage:', e);
    const months = [];
    for (let m = 0; m < 12; m++) {
      try {
        const key = storeId ? `peg-sales-${storeId}-${year}-${m}` : `peg-sales-${year}-${m}`;
        let raw = localStorage.getItem(key);
        if (!raw && storeId) raw = localStorage.getItem(`peg-sales-${year}-${m}`);
        months.push(raw ? JSON.parse(raw) : null);
      } catch { months.push(null); }
    }
    return months;
  }
}

// ── Users ──

// Load users for login screen (includes admins from all stores)
export async function loadUsers(storeId) {
  try {
    let q = supabase.from('crm_users').select('*').order('name');
    if (storeId) {
      q = q.or(`store_id.eq.${storeId},role.eq.admin`);
    }
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadUsers error:', e);
    return [];
  }
}

// Load users for admin panel (strict — only this store's users)
export async function loadStoreUsers(storeId) {
  try {
    let q = supabase.from('crm_users').select('*').order('name');
    if (storeId) q = q.eq('store_id', storeId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadStoreUsers error:', e);
    return [];
  }
}

export async function saveUsers(users, storeId) {
  try {
    const { error } = await supabase
      .from('crm_users')
      .upsert(users.map((u) => ({
        id: u.id, name: u.name, role: u.role, pin: u.pin, active: u.active !== false,
        ...(storeId ? { store_id: storeId } : {}),
      })));
    if (error) throw error;
  } catch (e) {
    console.error('saveUsers error:', e);
  }
}

export async function saveOneUser(user, isNew = false) {
  try {
    const row = { id: user.id, name: user.name, role: user.role, pin: user.pin, active: user.active !== false, store_id: user.store_id || 'goldsboro' };
    if (user.is_salesperson !== undefined) row.is_salesperson = user.is_salesperson;
    let result;
    if (isNew) {
      result = await supabase.from('crm_users').insert(row);
    } else {
      result = await supabase.from('crm_users').update(row).eq('id', user.id);
    }
    // If the column doesn't exist yet, retry without the optional field
    if (result.error && result.error.message && result.error.message.includes('is_salesperson')) {
      delete row.is_salesperson;
      if (isNew) result = await supabase.from('crm_users').insert(row);
      else result = await supabase.from('crm_users').update(row).eq('id', user.id);
    }
    if (result.error) {
      console.error('saveOneUser error:', result.error);
      alert('Error saving user: ' + result.error.message);
    }
  } catch (e) {
    console.error('saveOneUser error:', e);
    alert('Error saving user: ' + e.message);
  }
}

export async function deleteUser(id) {
  try {
    await supabase.from('crm_users').delete().eq('id', id);
  } catch (e) {
    console.error('deleteUser error:', e);
  }
}

export async function authenticate(userId, pin) {
  try {
    const { data, error } = await supabase
      .from('crm_users')
      .select('*')
      .eq('id', userId)
      .eq('pin', pin)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (e) {
    console.error('authenticate error:', e);
    return null;
  }
}

// ── Customers ──

export async function loadCustomers(filters = {}) {
  try {
    let q = supabase.from('customers').select('*').order('updated_at', { ascending: false });
    if (filters.store_id) q = q.eq('store_id', filters.store_id);
    if (filters.assigned_to) q = q.eq('assigned_to', filters.assigned_to);
    if (filters.status) q = q.eq('status', filters.status);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadCustomers error:', e);
    return [];
  }
}

export async function saveCustomer(customer) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .upsert(customer)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('saveCustomer error:', e);
    return customer;
  }
}

export async function deleteCustomer(id) {
  try {
    await supabase.from('customers').delete().eq('id', id);
  } catch (e) {
    console.error('deleteCustomer error:', e);
  }
}

// ── Interactions ──

export async function loadInteractions(customerId) {
  try {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadInteractions error:', e);
    return [];
  }
}

export async function saveInteraction(interaction) {
  try {
    const { data, error } = await supabase
      .from('interactions')
      .insert(interaction)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('saveInteraction error:', e);
    return interaction;
  }
}

// ── Reminders ──

export async function loadReminders(userId, includeCompleted = false) {
  try {
    let q = supabase.from('reminders').select('*, customers(first_name, last_name, phone, status)')
      .eq('user_id', userId)
      .order('due_date');
    if (!includeCompleted) q = q.eq('completed', false);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadReminders error:', e);
    return [];
  }
}

export async function loadAllReminders(includeCompleted = false) {
  try {
    let q = supabase.from('reminders').select('*, customers(first_name, last_name, phone, status)')
      .order('due_date');
    if (!includeCompleted) q = q.eq('completed', false);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadAllReminders error:', e);
    return [];
  }
}

export async function saveReminder(reminder) {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .upsert(reminder)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('saveReminder error:', e);
    return reminder;
  }
}

export async function completeReminder(id, notes) {
  try {
    const { error } = await supabase
      .from('reminders')
      .update({ completed: true, completed_at: new Date().toISOString(), completed_notes: notes || '' })
      .eq('id', id);
    if (error) throw error;
  } catch (e) {
    console.error('completeReminder error:', e);
  }
}

// ── Documents ──

export async function loadDocuments(category, storeId) {
  try {
    let q = supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (category && category !== 'all') q = q.eq('category', category);
    if (storeId) q = q.eq('store_id', storeId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadDocuments error:', e);
    return [];
  }
}

export async function uploadDocument(file, category, uploadedBy, storeId) {
  try {
    const filePath = `${storeId || 'general'}/${category}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('documents')
      .insert({
        uploaded_by: uploadedBy,
        category,
        name: file.name,
        file_path: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        ...(storeId ? { store_id: storeId } : {}),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('uploadDocument error:', e);
    return null;
  }
}

export async function deleteDocument(doc) {
  try {
    const path = doc.file_path.split('/documents/')[1];
    if (path) await supabase.storage.from('documents').remove([path]);
    await supabase.from('documents').delete().eq('id', doc.id);
  } catch (e) {
    console.error('deleteDocument error:', e);
  }
}

// ── Stores ──

export async function loadStores() {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadStores error:', e);
    return [];
  }
}

// ── Data Migration (localStorage → Supabase) ──

export async function migrateFromLocalStorage() {
  const migrated = { months: 0, users: 0 };
  try {
    for (let y = 2022; y <= 2027; y++) {
      for (let m = 0; m < 12; m++) {
        const key = `peg-sales-${y}-${m}`;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        const row = monthDataToRow(y, m, data);
        row.store_id = 'goldsboro';
        const { error } = await supabase
          .from('monthly_data')
          .upsert(row, { onConflict: 'store_id,year,month' });
        if (!error) migrated.months++;
      }
    }
    const usersRaw = localStorage.getItem('peg-auth-users');
    if (usersRaw) {
      const users = JSON.parse(usersRaw);
      for (const u of users) {
        const { error } = await supabase
          .from('crm_users')
          .upsert({ id: u.id, name: u.name, role: u.role, pin: u.pin, active: u.active !== false, store_id: 'goldsboro' });
        if (!error) migrated.users++;
      }
    }
  } catch (e) {
    console.error('Migration error:', e);
  }
  return migrated;
}

// ── Row Mappers ──

function rowToMonthData(row) {
  return {
    deals: row.deals || [],
    leads: row.leads || [],
    floorLeads: row.floor_leads || [],
    goals: row.goals || {},
    sp: row.salespeople || [],
    pga: row.pga_tiers || [],
    be: row.be_spiffs || [],
    hitList: row.hit_list || [],
    contests: row.contests || [],
    dailyLeadCounts: row.daily_lead_counts || [],
    bulkLeadCounts: row.bulk_lead_counts || [],
    floorDailyLeadCounts: row.floor_daily_counts || [],
    floorBulkLeadCounts: row.floor_bulk_counts || [],
    notes: row.notes || [],
    meetingNotes: row.meeting_notes || [],
    googleReviews: row.google_reviews || {},
    gsmChecklist: row.gsm_checklist || {},
    fiKpis: row.fi_kpis || {},
    fiChecklist: row.fi_checklist || {},
    fiDeals: row.fi_deals || [],
    fiTargets: row.fi_targets || {},
    gsmBonusConfig: row.gsm_bonus_config || {},
    historyCounts: row.history_counts || {},
    promos: row.promos || [],
    priceList: row.price_list || [],
    fiMenus: row.fi_menus || [],
    fiMenuConfig: row.fi_menu_config || {},
    promoRecords: row.promo_records || [],
    pricingRecords: row.pricing_records || [],
    inventoryItems: row.inventory_items || [],
  };
}

function monthDataToRow(year, month, data) {
  return {
    year, month,
    deals: data.deals || [],
    leads: data.leads || [],
    floor_leads: data.floorLeads || data.floor_leads || [],
    goals: data.goals || {},
    salespeople: data.sp || data.salespeople || [],
    pga_tiers: data.pga || data.pga_tiers || [],
    be_spiffs: data.be || data.be_spiffs || [],
    hit_list: data.hitList || data.hit_list || [],
    contests: data.contests || [],
    daily_lead_counts: data.dailyLeadCounts || data.daily_lead_counts || [],
    bulk_lead_counts: data.bulkLeadCounts || data.bulk_lead_counts || [],
    floor_daily_counts: data.floorDailyLeadCounts || data.floor_daily_counts || [],
    floor_bulk_counts: data.floorBulkLeadCounts || data.floor_bulk_counts || [],
    notes: data.notes || [],
    meeting_notes: data.meetingNotes || data.meeting_notes || [],
    google_reviews: data.googleReviews || data.google_reviews || {},
    gsm_checklist: data.gsmChecklist || data.gsm_checklist || {},
    fi_kpis: data.fiKpis || data.fi_kpis || {},
    fi_checklist: data.fiChecklist || data.fi_checklist || {},
    fi_deals: data.fiDeals || data.fi_deals || [],
    fi_targets: data.fiTargets || data.fi_targets || {},
    gsm_bonus_config: data.gsmBonusConfig || data.gsm_bonus_config || {},
    history_counts: data.historyCounts || data.history_counts || {},
    promos: data.promos || [],
    price_list: data.priceList || data.price_list || [],
    fi_menus: data.fiMenus || data.fi_menus || [],
    fi_menu_config: data.fiMenuConfig || data.fi_menu_config || {},
    promo_records: data.promoRecords || data.promo_records || [],
    pricing_records: data.pricingRecords || data.pricing_records || [],
    inventory_items: data.inventoryItems || data.inventory_items || [],
  };
}

function rowToDeal(row) {
  return {
    id: row.id,
    customer_id: row.customer_id,
    salesperson: row.salesperson,
    date: row.date,
    dealNumber: row.deal_number,
    customer: row.customer_name,
    units: row.units || {},
    pgaAmount: row.pga_amount || 0,
    backEndProducts: row.back_end_products || [],
    starChecklist: row.star_checklist || {},
    signoffs: row.signoffs || {},
    followUpDate: row.follow_up_date,
    referralNames: row.referral_names || '',
    referralDeclined: row.referral_declined || false,
    month: row.month,
    year: row.year,
  };
}

function dealToRow(deal) {
  return {
    id: deal.id || undefined,
    customer_id: deal.customer_id || null,
    salesperson: deal.salesperson,
    date: deal.date,
    deal_number: deal.dealNumber || deal.deal_number || '',
    customer_name: deal.customer || deal.customer_name || '',
    units: deal.units || {},
    pga_amount: deal.pgaAmount || deal.pga_amount || 0,
    back_end_products: deal.backEndProducts || deal.back_end_products || [],
    star_checklist: deal.starChecklist || deal.star_checklist || {},
    signoffs: deal.signoffs || {},
    follow_up_date: deal.followUpDate || deal.follow_up_date || null,
    referral_names: deal.referralNames || deal.referral_names || '',
    referral_declined: deal.referralDeclined || deal.referral_declined || false,
    month: deal.month,
    year: deal.year,
  };
}
