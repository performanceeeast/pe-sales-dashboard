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
    case 'dashboard': return true;
    case 'deals': return true;
    case 'board': return true;
    case 'promos': return true;
    case 'history': return true;
    case 'docs': return true;

    // CRM — disabled for now
    case 'crm': return false;

    // ISM — only for stores with ISM, not for salespeople
    case 'leads': return storeConfig?.has_ism !== false && currentUser.role !== 'salesperson' && (isManager(currentUser.role) || currentUser.role === 'ism');

    // Floor traffic — managers + ISM
    case 'floor': return isManager(currentUser.role) || currentUser.role === 'ism';

    // Goals — managers only
    case 'goals': return isManager(currentUser.role);

    // GSM Dash — managers only, hidden for stores without ISM (use combined view)
    case 'gsmDash': return isManager(currentUser.role) && storeConfig?.has_ism !== false;

    // F&I Dash — finance roles + managers, hidden for stores without ISM (use combined view)
    case 'financeDash': return (isManager(currentUser.role) || isFinanceRole(currentUser.role)) && storeConfig?.has_ism !== false;

    // Combined Sales/Finance Manager Dash — only for stores WITHOUT ISM (Cedar Point)
    case 'mgrDash': return isManager(currentUser.role) && storeConfig?.has_ism === false;

    // Simple leads tab — only for stores WITHOUT ISM (Cedar Point), managers only
    case 'simpleLeads': return isManager(currentUser.role) && storeConfig?.has_ism === false;

    // F&I Menu — all roles except ISM-only (everyone can build menus, settings restricted separately)
    case 'fiMenu': return isManager(currentUser.role) || isFinanceRole(currentUser.role) || currentUser.role === 'salesperson';

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
