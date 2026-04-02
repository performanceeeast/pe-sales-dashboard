/**
 * Promo & Pricing Intelligence — Data models, statuses, categories, helpers.
 * Follows the fiMenuConstants.js pattern.
 */

// ── Upload File Types ──
export const UPLOAD_TYPES = [
  { id: 'monthly_promo', label: 'Monthly Promotion', icon: '\uD83C\uDF1F' },
  { id: 'rebate_program', label: 'Rebate Program', icon: '\uD83D\uDCB0' },
  { id: 'apr_program', label: 'APR / Finance Program', icon: '\uD83D\uDCB3' },
  { id: 'rate_term_matrix', label: 'Rate / Term Matrix', icon: '\uD83D\uDCC8' },
  { id: 'price_list', label: 'Model-Year Price List', icon: '\uD83D\uDCB2' },
  { id: 'msrp_sheet', label: 'MSRP Sheet', icon: '\uD83D\uDCCB' },
  { id: 'carryover_pricing', label: 'Carryover Pricing', icon: '\uD83D\uDD04' },
  { id: 'misc', label: 'Other Pricing / Promo File', icon: '\uD83D\uDCC4' },
];

// ── Record Statuses ──
export const PROMO_STATUSES = {
  draft: { label: 'DRAFT', color: '#6b7280', bg: '#f3f4f6', description: 'Parsed but not yet reviewed' },
  review: { label: 'NEEDS REVIEW', color: '#d97706', bg: '#fef3c7', description: 'Awaiting manager approval' },
  published: { label: 'PUBLISHED', color: '#16a34a', bg: '#dcfce7', description: 'Active and visible to team' },
  expired: { label: 'EXPIRED', color: '#94a3b8', bg: '#f1f5f9', description: 'Past effective end date' },
  archived: { label: 'ARCHIVED', color: '#64748b', bg: '#e2e8f0', description: 'Manually archived' },
  rejected: { label: 'REJECTED', color: '#b91c1c', bg: '#fef2f2', description: 'Rejected during review' },
};

// ── OEM Brands ──
export const OEM_BRANDS = [
  'Polaris', 'Honda', 'Yamaha', 'Can-Am (BRP)', 'Kawasaki',
  'Sea-Doo (BRP)', 'Suzuki', 'Mercury', 'Evinrude',
  'Robalo', 'Sportsman Boats', 'Key West', 'Tidewater',
  'Magic Tilt', 'Load Rite', 'EZ Loader',
  'Other',
];

// ── Promo Record Model ──
export function createEmptyPromo(currentUser, storeId) {
  return {
    id: '',
    status: 'draft',
    type: 'monthly_promo', // one of UPLOAD_TYPES ids
    // Source
    sourceFileId: null, // reference to documents table
    sourceFileName: '',
    // Identity
    brand: '',
    programName: '',
    programMonth: '',
    // Dates
    effectiveStart: '',
    effectiveEnd: '',
    // Scope
    storeIds: storeId ? [storeId] : [],
    categories: [], // ATV, SXS, PWC, BOAT, etc.
    eligibleModelYears: [],
    eligibleModels: '', // free text or comma-separated
    newUsed: 'new', // new | used | both
    // Offers
    aprRate: null,
    aprTerm: null,
    aprMinFinanced: null,
    rebateAmount: null,
    customerCash: null,
    specialFinancing: '',
    // Meta
    stackable: false,
    disclaimer: '',
    notes: '',
    // Audit
    createdBy: currentUser?.id || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedBy: '',
    publishedAt: '',
  };
}

// ── Pricing Record Model ──
export function createEmptyPricingRecord() {
  return {
    id: '',
    status: 'draft',
    sourceFileId: null,
    sourceFileName: '',
    // Identity
    year: new Date().getFullYear(),
    make: '',
    model: '',
    trim: '',
    category: '',
    // Pricing
    msrp: 0,
    freight: 0,
    setup: 0,
    destination: 0,
    suggestedSalePrice: 0,
    // Scope
    storeIds: [],
    newUsed: 'new',
    notes: '',
    // Audit
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── Helpers ──

export function getActivePromos(promos, storeId) {
  const now = new Date().toISOString().split('T')[0];
  return (promos || []).filter((p) => {
    if (p.status !== 'published') return false;
    if (p.effectiveEnd && p.effectiveEnd < now) return false;
    if (p.effectiveStart && p.effectiveStart > now) return false;
    if (storeId && p.storeIds?.length > 0 && !p.storeIds.includes(storeId)) return false;
    return true;
  });
}

export function getExpiringPromos(promos, storeId, daysAhead = 7) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 86400000).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];
  return getActivePromos(promos, storeId).filter((p) => p.effectiveEnd && p.effectiveEnd <= cutoff && p.effectiveEnd >= today);
}

export function getPromosByBrand(promos, brand) {
  return (promos || []).filter((p) => p.brand === brand);
}

export function getPromosByCategory(promos, category) {
  return (promos || []).filter((p) => p.categories?.length === 0 || p.categories?.includes(category));
}
