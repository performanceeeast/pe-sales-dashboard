/**
 * Auth & Permissions — Multi-store aware
 */

export const ROLES = {
  admin: { label: 'Admin', color: '#b91c1c', access: 'all' },
  gsm: { label: 'Sales Manager', color: '#d97706', access: 'all' },
  finance: { label: 'Finance Manager', color: '#2563eb', access: 'finance+deals' },
  ism: { label: 'Internet Sales', color: '#0284c7', access: 'ism+deals' },
  salesperson: { label: 'Salesperson', color: '#16a34a', access: 'own-deals' },
  sales_finance_mgr: { label: 'Sales/Finance Mgr', color: '#d97706', access: 'all' },
};

// Get available roles for a store's config
export function getRolesForStore(storeConfig) {
  if (!storeConfig) return ROLES;
  const available = {};
  // Always include admin and salesperson
  available.admin = ROLES.admin;
  available.salesperson = ROLES.salesperson;

  if (storeConfig.has_ism) {
    available.gsm = ROLES.gsm;
    available.finance = ROLES.finance;
    available.ism = ROLES.ism;
  } else {
    // No ISM = combined sales/finance manager (like Cedar Point)
    available.sales_finance_mgr = ROLES.sales_finance_mgr;
  }
  return available;
}

// Helper: is this user a manager-level role?
function isManager(role) {
  return role === 'admin' || role === 'gsm' || role === 'sales_finance_mgr';
}

function isFinanceRole(role) {
  return role === 'finance' || role === 'sales_finance_mgr';
}

// Permission helpers
export function canEditDeal(currentUser, deal) {
  if (!currentUser) return false;
  if (isManager(currentUser.role)) return true;
  return currentUser.id === deal.salesperson;
}

export function canSeeTab(currentUser, tab, storeConfig) {
  if (!currentUser) return false;

  switch (tab) {
    // Everyone
    case 'dashboard': return true;
    case 'sales': return true; // Deals + Leaderboard + History consolidated

    // Leads — managers + ISM + finance (not regular salespeople)
    case 'leads': return isManager(currentUser.role) || currentUser.role === 'ism' || isFinanceRole(currentUser.role);

    // Manager — managers only (Goals + GSM + Pricing)
    case 'manager': return isManager(currentUser.role);

    // F&I — managers + finance roles
    case 'financeDash': return isManager(currentUser.role) || isFinanceRole(currentUser.role);

    // Legacy keys (kept for backward compat if view state references them)
    case 'deals': return true;
    case 'board': return true;
    case 'history': return true;
    case 'promos': return true;
    case 'goals': return isManager(currentUser.role);
    case 'gsmDash': return isManager(currentUser.role);
    case 'crm': return false;

    default: return true;
  }
}

// F&I Menu specific permissions
export function canEditFiMenuSettings(currentUser) {
  if (!currentUser) return false;
  return isManager(currentUser.role) || isFinanceRole(currentUser.role);
}

export function canViewFiMenuCost(currentUser) {
  if (!currentUser) return false;
  return isManager(currentUser.role) || isFinanceRole(currentUser.role);
}

export function canEditGoals(currentUser) {
  if (!currentUser) return false;
  return isManager(currentUser.role);
}

export function canManageUsers(currentUser) {
  if (!currentUser) return false;
  return currentUser.role === 'admin';
}

export function canSeeAllCustomers(currentUser) {
  if (!currentUser) return false;
  return isManager(currentUser.role) || currentUser.role === 'ism';
}

export function canDeleteCustomer(currentUser) {
  if (!currentUser) return false;
  return isManager(currentUser.role) || currentUser.role === 'ism';
}
