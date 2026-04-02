/**
 * Auth & Permissions
 * User data now stored in Supabase crm_users table.
 * loadUsers/saveUsers/authenticate are in storage.js
 */

export const ROLES = {
  admin: { label: 'Admin', color: '#b91c1c', access: 'all' },
  gsm: { label: 'Sales Manager', color: '#d97706', access: 'all' },
  finance: { label: 'Finance Manager', color: '#2563eb', access: 'finance+deals' },
  ism: { label: 'Internet Sales', color: '#0284c7', access: 'ism+deals' },
  salesperson: { label: 'Salesperson', color: '#16a34a', access: 'own-deals' },
};

// Permission helpers
export function canEditDeal(currentUser, deal) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin' || currentUser.role === 'gsm') return true;
  return currentUser.id === deal.salesperson;
}

export function canSeeTab(currentUser, tab) {
  if (!currentUser) return false;
  if (currentUser.role === 'admin' || currentUser.role === 'gsm') return true;

  switch (tab) {
    case 'dashboard': return true;
    case 'deals': return true;
    case 'leads': return currentUser.role !== 'salesperson'; // ISM dashboard — not for regular salespeople
    case 'floor': return currentUser.role !== 'salesperson';
    case 'board': return true;
    case 'goals': return currentUser.role === 'admin' || currentUser.role === 'gsm';
    case 'crm': return currentUser.role === 'admin'; // CRM hidden — testing only
    case 'promos': return true; // Everyone can see promos & pricing
    case 'history': return true;
    case 'gsmDash': return currentUser.role === 'admin' || currentUser.role === 'gsm';
    case 'financeDash': return currentUser.role === 'admin' || currentUser.role === 'gsm' || currentUser.role === 'finance';
    case 'docs': return true;
    default: return true;
  }
}

export function canEditGoals(currentUser) {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'gsm';
}

export function canManageUsers(currentUser) {
  if (!currentUser) return false;
  return currentUser.role === 'admin';
}

export function canSeeAllCustomers(currentUser) {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'gsm' || currentUser.role === 'ism';
}

export function canDeleteCustomer(currentUser) {
  if (!currentUser) return false;
  return currentUser.role === 'admin' || currentUser.role === 'gsm' || currentUser.role === 'ism';
}
