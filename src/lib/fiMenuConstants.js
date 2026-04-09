/**
 * F&I Menu Constants — Product catalog, packages, helpers.
 * Store-aware: products filtered by unit category.
 */

// ── Product Catalog (seed data for Performance East) ──
export const DEFAULT_FI_PRODUCTS = [
  {
    id: 'esc', name: 'Extended Service Contract', description: 'Mechanical breakdown protection beyond factory warranty',
    category: 'universal', retailPrice: 1895, cost: 750, term: '36-84 mo',
    taxable: false, financeable: true, provider: 'Zurich', contractCode: 'ZUR-ESC',
    disclaimer: 'See contract for complete terms, conditions, and exclusions.',
  },
  {
    id: 'gap', name: 'GAP Protection', description: 'Covers the difference between insurance payout and loan balance if unit is totaled or stolen',
    category: 'universal', retailPrice: 895, cost: 350, term: 'Life of loan',
    taxable: false, financeable: true, provider: 'Protective',
    disclaimer: 'GAP waiver does not cover delinquent payments or late fees.',
  },
  {
    id: 'tire_wheel', name: 'Tire & Wheel Protection', description: 'Covers repair or replacement of tires and wheels from road hazards',
    category: 'powersports', retailPrice: 595, cost: 200, term: '36 mo',
    taxable: false, financeable: true, provider: 'Zurich',
  },
  {
    id: 'theft_gps', name: 'Theft / GPS Recovery', description: 'GPS tracking device with theft recovery assistance',
    category: 'universal', retailPrice: 695, cost: 300, term: '36 mo',
    taxable: true, financeable: true, provider: 'LoJack',
  },
  {
    id: 'prepaid_maint', name: 'Prepaid Maintenance Plan', description: 'Covers scheduled maintenance services at dealership',
    category: 'universal', retailPrice: 495, cost: 175, term: '24-36 mo',
    taxable: false, financeable: true, provider: 'Performance East',
  },
  {
    id: 'battery', name: 'Battery Protection Plus', description: 'Extended battery coverage including replacement',
    category: 'universal', retailPrice: 295, cost: 100, term: '36 mo',
    taxable: false, financeable: true, provider: 'Performance East',
  },
  {
    id: 'gelcoat', name: 'Gelcoat Protection', description: 'Professional gelcoat and fiberglass protection for marine units',
    category: 'marine', retailPrice: 795, cost: 275, term: '60 mo',
    taxable: true, financeable: true, provider: 'Marine Protection Group',
  },
  {
    id: 'appearance', name: 'Appearance Protection', description: 'Interior and exterior protection package',
    category: 'universal', retailPrice: 395, cost: 150, term: '36 mo',
    taxable: true, financeable: true, provider: 'Zurich',
  },
  {
    id: 'vip_service', name: 'VIP Service Plan', description: 'Premium service plan with priority scheduling and discounts',
    category: 'marine', retailPrice: 995, cost: 400, term: '24 mo',
    taxable: false, financeable: true, provider: 'Performance East',
  },
  {
    id: 'lifetime_service', name: 'Lifetime Service Plan', description: 'Lifetime oil changes and basic service coverage',
    category: 'universal', retailPrice: 1295, cost: 500, term: 'Lifetime',
    taxable: false, financeable: true, provider: 'Performance East',
  },
];

// ── Package Templates ──
export const DEFAULT_FI_PACKAGES = [
  {
    id: 'platinum', name: 'Platinum', description: 'Maximum protection — every product included',
    products: ['esc', 'gap', 'tire_wheel', 'theft_gps', 'prepaid_maint', 'battery', 'appearance'],
    color: '#7c3aed', displayOrder: 1, recommended: false,
  },
  {
    id: 'gold', name: 'Gold', description: 'Comprehensive coverage for most owners',
    products: ['esc', 'gap', 'prepaid_maint', 'appearance'],
    color: '#d97706', displayOrder: 2, recommended: true,
  },
  {
    id: 'silver', name: 'Silver', description: 'Essential protection at a great value',
    products: ['esc', 'gap'],
    color: '#2563eb', displayOrder: 3, recommended: false,
  },
  {
    id: 'basic', name: 'Basic', description: 'Minimum recommended coverage',
    products: ['esc'],
    color: '#6b7280', displayOrder: 4, recommended: false,
  },
];

// ── Lenders ──
export const DEFAULT_LENDERS = [
  'Sheffield Financial', 'Medallion Bank', 'Synchrony Financial',
  'Wells Fargo Dealer Services', 'TD Auto Finance', 'Cash', 'Other',
];

// ── Terms ──
export const DEFAULT_TERMS = [24, 36, 48, 60, 72, 84, 96, 120, 144, 180, 240];

// ── Menu Statuses ──
export const MENU_STATUSES = {
  draft: { label: 'DRAFT', color: '#6b7280', bg: '#f3f4f6' },
  presented: { label: 'PRESENTED', color: '#2563eb', bg: '#eff6ff' },
  accepted: { label: 'ACCEPTED', color: '#16a34a', bg: '#f0fdf4' },
  declined: { label: 'DECLINED', color: '#b91c1c', bg: '#fef2f2' },
  printed: { label: 'PRINTED', color: '#7c3aed', bg: '#f5f3ff' },
};

// ── Product Categories ──
// 'powersports' is the legacy name for 'offroad' — treated as an alias everywhere for backward compat.
export const PRODUCT_CATEGORIES = [
  { id: 'universal', label: 'Universal', color: '#6b7280', bg: 'var(--bg-tertiary)' },
  { id: 'offroad', label: 'Offroad', color: '#b91c1c', bg: '#fef2f2' },
  { id: 'marine', label: 'Marine', color: '#2563eb', bg: '#eff6ff' },
  { id: 'pwc_jetboat', label: 'PWC / Jet Boat', color: '#0891b2', bg: '#ecfeff' },
];

// Normalize legacy 'powersports' → 'offroad' for display/filter purposes (does not mutate data)
export function normalizeCategory(cat) {
  if (cat === 'powersports') return 'offroad';
  return cat || 'universal';
}

// Map a unit type (ATV, SXS, BOAT, PWC, etc.) to its F&I category
export function getCategoryForUnitType(unitType) {
  if (!unitType) return 'universal';
  const u = String(unitType).toUpperCase();
  if (u === 'PWC') return 'pwc_jetboat';
  if (u === 'BOAT' || u === 'ENGINE REPOWER') return 'marine';
  if (u === 'ATV' || u === 'SXS' || u === 'YOUTH') return 'offroad';
  return 'universal';
}

// ── Store-Aware Product Filter ──
export function getProductsForStore(storeConfig, allProducts) {
  const products = allProducts || DEFAULT_FI_PRODUCTS;
  if (!storeConfig?.unit_types) return products;

  const types = storeConfig.unit_types;
  const hasMarine = types.some((t) => ['BOAT', 'ENGINE REPOWER'].includes(t));
  const hasOffroad = types.some((t) => ['ATV', 'SXS', 'YOUTH'].includes(t));
  const hasPwcJetBoat = types.some((t) => ['PWC'].includes(t));

  return products.filter((p) => {
    const cat = normalizeCategory(p.category);
    if (cat === 'universal') return true;
    if (cat === 'marine' && hasMarine) return true;
    if (cat === 'offroad' && hasOffroad) return true;
    if (cat === 'pwc_jetboat' && hasPwcJetBoat) return true;
    return false;
  });
}

// Get default doc fee and tax rate for a given unit type based on per-category settings
export function getDefaultsForCategory(config, category) {
  const cat = normalizeCategory(category);
  const perCat = config?.defaultsPerCategory || {};
  const fallbackDocFee = config?.defaultDocFee ?? 299;
  const fallbackTaxRate = config?.defaultTaxRate ?? 0;
  const catDefaults = perCat[cat] || {};
  return {
    docFee: catDefaults.docFee ?? fallbackDocFee,
    taxRate: catDefaults.taxRate ?? fallbackTaxRate,
  };
}

// ── Package Filter (remove products not available for this store) ──
export function getPackagesForStore(storeConfig, allProducts, allPackages) {
  const available = getProductsForStore(storeConfig, allProducts);
  const availableIds = available.map((p) => p.id);
  const packages = allPackages || DEFAULT_FI_PACKAGES;

  return packages.map((pkg) => ({
    ...pkg,
    products: pkg.products.filter((pid) => availableIds.includes(pid)),
  })).filter((pkg) => pkg.products.length > 0);
}

// ── Empty Menu Template ──
export function createEmptyMenu(currentUser, storeConfig, storeId) {
  return {
    id: '', status: 'draft', store_id: storeId || '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    createdBy: currentUser?.id || '',
    // Deal
    customer: '', date: new Date().toISOString().split('T')[0],
    salesperson: '', financeManager: currentUser?.name || '', dealNumber: '',
    // Unit
    unitType: (storeConfig?.unit_types || [])[0] || '', unitCategory: '',
    productCategory: '', // explicit catalog category (universal/offroad/marine/pwc_jetboat), overrides unit-type-derived
    make: '', model: '', year: new Date().getFullYear(), vin: '', newUsed: 'new',
    // Pricing
    salePrice: 0, accessories: 0, freight: 0, prep: 0, freightPrep: 0, docFee: 299,
    taxRate: 0, downPayment: 0, tradeAllowance: 0, tradePayoff: 0,
    // Finance
    lender: '', term: 60, apr: 0,
    // Calculated (stored for historical accuracy)
    amountFinanced: 0, monthlyPayment: 0, totalOfPayments: 0, financeCharge: 0, basePayment: 0,
    // Products
    selectedProducts: [], selectedPackage: null,
    // Notes
    dealNotes: '', disclaimerText: 'All prices and payments are estimates. Final terms subject to lender approval.',
  };
}
