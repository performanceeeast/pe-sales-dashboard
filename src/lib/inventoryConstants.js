/**
 * Inventory Intelligence — Data models, statuses, import field mappings.
 * Separates: raw upload → parsed draft → normalized → published snapshot.
 */

// ── Import Statuses ──
export const IMPORT_STATUSES = {
  raw: { label: 'RAW UPLOAD', color: '#6b7280', bg: '#f3f4f6' },
  parsed: { label: 'PARSED', color: '#2563eb', bg: '#eff6ff' },
  review: { label: 'NEEDS REVIEW', color: '#d97706', bg: '#fef3c7' },
  published: { label: 'ACTIVE', color: '#16a34a', bg: '#dcfce7' },
  archived: { label: 'ARCHIVED', color: '#64748b', bg: '#e2e8f0' },
};

// ── Unit Statuses ──
export const UNIT_STATUSES = {
  in_stock: { label: 'IN STOCK', color: '#16a34a', bg: '#dcfce7' },
  on_order: { label: 'ON ORDER', color: '#2563eb', bg: '#eff6ff' },
  sold: { label: 'SOLD', color: '#7c3aed', bg: '#f5f3ff' },
  hold: { label: 'ON HOLD', color: '#d97706', bg: '#fef3c7' },
  trade_in: { label: 'TRADE-IN', color: '#0891b2', bg: '#ecfeff' },
  pending_delivery: { label: 'PENDING DELIVERY', color: '#d97706', bg: '#fef3c7' },
};

// ── Condition ──
export const CONDITIONS = ['New', 'Used', 'Demo', 'Consignment'];

// ── Common DMS/Lightspeed column mappings ──
// Maps common export column headers to our normalized field names
export const COLUMN_MAPPINGS = {
  // Stock / ID
  stock: ['stock', 'stock #', 'stock no', 'stock number', 'stk', 'stk #', 'stk no', 'unit #', 'unit no'],
  vin: ['vin', 'vin #', 'serial', 'serial #', 'serial number', 'hull id', 'hin'],
  // Unit identity
  year: ['year', 'yr', 'model year', 'model yr'],
  make: ['make', 'brand', 'manufacturer', 'oem', 'mfg'],
  model: ['model', 'model name', 'model description', 'description'],
  trim: ['trim', 'package', 'configuration', 'spec', 'option', 'sub model'],
  color: ['color', 'colour', 'ext color', 'exterior color'],
  // Classification
  category: ['category', 'type', 'unit type', 'class', 'vehicle type', 'dept', 'department'],
  condition: ['condition', 'new/used', 'new used', 'status type', 'cond'],
  // Pricing
  msrp: ['msrp', 'retail', 'list price', 'suggested retail', 'srp', 'sticker'],
  invoiceCost: ['invoice', 'invoice cost', 'cost', 'dealer cost', 'wholesale', 'floorplan cost'],
  internetPrice: ['internet price', 'web price', 'sale price', 'asking price', 'advertised price'],
  // Dates
  dateReceived: ['date received', 'received', 'recv date', 'in stock date', 'arrival date', 'date in'],
  dateSold: ['date sold', 'sold date', 'sale date'],
  // Status
  status: ['status', 'unit status', 'inventory status', 'disp', 'disposition'],
  // Location
  location: ['location', 'lot', 'store', 'branch', 'site'],
  // Floorplan
  floorplanDays: ['days', 'days in stock', 'age', 'days on lot', 'floor days', 'floorplan days', 'doi'],
  // Notes
  notes: ['notes', 'comments', 'memo', 'description notes'],
};

// ── Normalized Inventory Item Model ──
export function createEmptyInventoryItem(storeId) {
  return {
    id: '',
    importId: null, // links to the import batch
    status: 'in_stock',
    // Identity
    stock: '',
    vin: '',
    year: new Date().getFullYear(),
    make: '',
    model: '',
    trim: '',
    color: '',
    // Classification
    category: '', // ATV, SXS, PWC, BOAT, TRAILER, YOUTH, ENGINE REPOWER
    condition: 'New',
    // Pricing
    msrp: 0,
    invoiceCost: 0,
    internetPrice: 0,
    // Dates
    dateReceived: '',
    dateSold: '',
    // Location
    storeId: storeId || '',
    location: '',
    // Calculated
    floorplanDays: 0,
    // Notes
    notes: '',
    // Promo matching (populated by matching engine)
    activePromos: [], // ids of matching promo records
    // Audit
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceFileName: '',
  };
}

// ── Import Batch Model ──
export function createImportBatch(currentUser, storeId, fileName) {
  return {
    id: Date.now().toString(),
    status: 'parsed', // raw → parsed → review → published → archived
    fileName,
    storeId: storeId || '',
    importedBy: currentUser?.id || '',
    importedAt: new Date().toISOString(),
    publishedAt: '',
    publishedBy: '',
    recordCount: 0,
    warnings: [],
  };
}

// ── Aging Buckets ──
export const AGING_BUCKETS = [
  { id: '0-30', label: '0-30 Days', min: 0, max: 30, color: '#16a34a' },
  { id: '31-60', label: '31-60 Days', min: 31, max: 60, color: '#d97706' },
  { id: '61-90', label: '61-90 Days', min: 61, max: 90, color: '#ea580c' },
  { id: '91-120', label: '91-120 Days', min: 91, max: 120, color: '#dc2626' },
  { id: '120+', label: '120+ Days', min: 121, max: 99999, color: '#7f1d1d' },
];

// ── Helpers ──

export function calcFloorplanDays(dateReceived) {
  if (!dateReceived) return 0;
  const received = new Date(dateReceived);
  const now = new Date();
  return Math.max(0, Math.floor((now - received) / 86400000));
}

export function getAgingBucket(days) {
  return AGING_BUCKETS.find((b) => days >= b.min && days <= b.max) || AGING_BUCKETS[AGING_BUCKETS.length - 1];
}

export function getInventoryByCategory(items, category) {
  return (items || []).filter((i) => !category || i.category === category);
}

export function getInventoryByStatus(items, status) {
  return (items || []).filter((i) => i.status === status);
}

export function getAgedInventory(items, minDays = 61) {
  return (items || []).filter((i) => {
    const days = i.floorplanDays || calcFloorplanDays(i.dateReceived);
    return days >= minDays;
  });
}

export function getInventorySummary(items) {
  const summary = { total: 0, inStock: 0, onOrder: 0, sold: 0, hold: 0, totalMsrp: 0, totalCost: 0, avgAge: 0, categories: {} };
  let totalDays = 0;
  (items || []).forEach((i) => {
    summary.total++;
    if (i.status === 'in_stock') summary.inStock++;
    if (i.status === 'on_order') summary.onOrder++;
    if (i.status === 'sold') summary.sold++;
    if (i.status === 'hold') summary.hold++;
    summary.totalMsrp += i.msrp || 0;
    summary.totalCost += i.invoiceCost || 0;
    const days = i.floorplanDays || calcFloorplanDays(i.dateReceived);
    totalDays += days;
    if (!summary.categories[i.category]) summary.categories[i.category] = 0;
    summary.categories[i.category]++;
  });
  summary.avgAge = summary.total > 0 ? Math.round(totalDays / summary.total) : 0;
  return summary;
}
