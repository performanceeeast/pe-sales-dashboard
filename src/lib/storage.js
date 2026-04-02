/**
 * Storage layer — Supabase primary, localStorage cache for offline.
 * All functions are async. The app reads from Supabase and writes back.
 */
import { supabase } from './supabaseClient';

// ── Monthly Data (goals, KPIs, checklists, etc.) ──

export async function loadMonth(year, month) {
  try {
    const { data, error } = await supabase
      .from('monthly_data')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .maybeSingle();
    if (error) throw error;
    if (data) return rowToMonthData(data);
    return null;
  } catch (e) {
    console.error('loadMonth error, falling back to localStorage:', e);
    try {
      const raw = localStorage.getItem(`peg-sales-${year}-${month}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}

export async function saveMonth(year, month, data) {
  const row = monthDataToRow(year, month, data);
  try {
    const { error } = await supabase
      .from('monthly_data')
      .upsert(row, { onConflict: 'year,month' });
    if (error) throw error;
    // Also cache in localStorage
    localStorage.setItem(`peg-sales-${year}-${month}`, JSON.stringify(data));
  } catch (e) {
    console.error('saveMonth error, saving to localStorage:', e);
    localStorage.setItem(`peg-sales-${year}-${month}`, JSON.stringify(data));
  }
}

export async function loadYear(year) {
  try {
    const { data, error } = await supabase
      .from('monthly_data')
      .select('*')
      .eq('year', year)
      .order('month');
    if (error) throw error;
    const months = Array(12).fill(null);
    (data || []).forEach((row) => { months[row.month] = rowToMonthData(row); });
    return months;
  } catch (e) {
    console.error('loadYear error, falling back to localStorage:', e);
    const months = [];
    for (let m = 0; m < 12; m++) {
      try {
        const raw = localStorage.getItem(`peg-sales-${year}-${m}`);
        months.push(raw ? JSON.parse(raw) : null);
      } catch { months.push(null); }
    }
    return months;
  }
}

// ── Deals (individual deal records in Supabase) ──

export async function loadDeals(year, month) {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .order('date');
    if (error) throw error;
    return (data || []).map(rowToDeal);
  } catch (e) {
    console.error('loadDeals error:', e);
    return [];
  }
}

export async function saveDeal(deal) {
  const row = dealToRow(deal);
  try {
    const { data, error } = await supabase
      .from('deals')
      .upsert(row)
      .select()
      .single();
    if (error) throw error;
    return rowToDeal(data);
  } catch (e) {
    console.error('saveDeal error:', e);
    return deal;
  }
}

export async function deleteDeal(id) {
  try {
    await supabase.from('deals').delete().eq('id', id);
  } catch (e) {
    console.error('deleteDeal error:', e);
  }
}

// ── Users ──

export async function loadUsers() {
  try {
    const { data, error } = await supabase
      .from('crm_users')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadUsers error:', e);
    // Fallback to localStorage
    try {
      const raw = localStorage.getItem('peg-auth-users');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
}

export async function saveUsers(users) {
  try {
    // Upsert all users
    const { error } = await supabase
      .from('crm_users')
      .upsert(users.map((u) => ({
        id: u.id, name: u.name, role: u.role, pin: u.pin, active: u.active !== false,
      })));
    if (error) throw error;
  } catch (e) {
    console.error('saveUsers error:', e);
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

export async function loadDocuments(category) {
  try {
    let q = supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (category && category !== 'all') q = q.eq('category', category);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('loadDocuments error:', e);
    return [];
  }
}

export async function uploadDocument(file, category, uploadedBy) {
  try {
    const filePath = `${category}/${Date.now()}_${file.name}`;
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
    // Delete from storage
    const path = doc.file_path.split('/documents/')[1];
    if (path) await supabase.storage.from('documents').remove([path]);
    // Delete record
    await supabase.from('documents').delete().eq('id', doc.id);
  } catch (e) {
    console.error('deleteDocument error:', e);
  }
}

// ── Data Migration (localStorage → Supabase) ──

export async function migrateFromLocalStorage() {
  const migrated = { months: 0, users: 0 };
  try {
    // Migrate monthly data
    for (let y = 2022; y <= 2027; y++) {
      for (let m = 0; m < 12; m++) {
        const key = `peg-sales-${y}-${m}`;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        const row = monthDataToRow(y, m, data);
        const { error } = await supabase
          .from('monthly_data')
          .upsert(row, { onConflict: 'year,month' });
        if (!error) migrated.months++;
      }
    }
    // Migrate users
    const usersRaw = localStorage.getItem('peg-auth-users');
    if (usersRaw) {
      const users = JSON.parse(usersRaw);
      for (const u of users) {
        const { error } = await supabase
          .from('crm_users')
          .upsert({ id: u.id, name: u.name, role: u.role, pin: u.pin, active: u.active !== false });
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
    floorLeads: [],
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
  };
}

function monthDataToRow(year, month, data) {
  return {
    year, month,
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
    leads: data.leads || [],
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
    accessories: row.accessories || false,
    starChecklist: row.star_checklist || {},
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
    accessories: deal.accessories || false,
    star_checklist: deal.starChecklist || deal.star_checklist || {},
    follow_up_date: deal.followUpDate || deal.follow_up_date || null,
    referral_names: deal.referralNames || deal.referral_names || '',
    referral_declined: deal.referralDeclined || deal.referral_declined || false,
    month: deal.month,
    year: deal.year,
  };
}
