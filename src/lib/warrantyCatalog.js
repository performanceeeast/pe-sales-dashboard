/**
 * Centralized Outboard Extended Warranty Rate Catalog
 * Shared across ALL stores — both Goldsboro and Cedar Point consume this.
 *
 * DATA SOURCES (exact from rate sheets):
 * - Yamaha Y.E.S. Outboard Retail + Dealer Pricing (effective 1/1/2026, REV 1/29/26)
 * - Suzuki Extended Protection New + Used (effective 2/1/2023)
 * - Mercury Product Protection Gold Outboard (effective 9/29/2025)
 * - Mercury Product Protection Platinum Outboard (effective 9/29/2025)
 *
 * TO UPDATE PRICING: Edit WARRANTY_RATES, update effectiveDate, commit & deploy.
 */

// ── Surcharge Rules (Mercury Gold & Platinum — identical rules) ──
// Standard purchase period is first 12 months of limited warranty.
// Contracts purchased after that have surcharges.
export const SURCHARGE_RULES = {
  // Less than 75 HP
  merc_lt75_13_24: { label: '13-24 Months (<75 HP)', amount: 35, type: 'flat', description: '+$35 surcharge' },
  merc_lt75_25_36: { label: '25-36 Months (<75 HP)', amount: 60, type: 'flat', description: '+$60 surcharge' },
  // 75 HP and greater
  merc_gte75_13_24: { label: '13-24 Months (75+ HP)', amount: 125, type: 'flat', description: '+$125 surcharge' },
  merc_gte75_25_36: { label: '25-36 Months (75+ HP)', amount: 225, type: 'flat', description: '+$225 surcharge' },
};

// ── Brand Config ──
export const WARRANTY_BRANDS = [
  { id: 'mercury', name: 'Mercury', plans: ['mercury_gold', 'mercury_platinum'] },
  { id: 'yamaha', name: 'Yamaha', plans: ['yamaha_yes'] },
  { id: 'suzuki', name: 'Suzuki', plans: ['suzuki_sep'] },
];

export const WARRANTY_PLANS = {
  mercury_gold: { id: 'mercury_gold', brand: 'mercury', name: 'Mercury Gold', provider: 'Mercury Marine', deductible: '$50', disclaimer: 'MPP Gold: $50 deductible per claim. Genuine Quicksilver/Mercury parts & labor. Transferable. Up to $200 tow-in. Must be purchased within limited warranty period; surcharges apply after first 12 months. Box date must be current year or 4 prior. <500 hours, pleasure use only.' },
  mercury_platinum: { id: 'mercury_platinum', brand: 'mercury', name: 'Mercury Platinum', provider: 'Mercury Marine', deductible: '$50', disclaimer: 'MPP Platinum: $50 deductible per claim. Similar coverage to factory limited warranty. Transferable. Up to $200 hoist/haul out (boats 26ft+), up to $200 tow-in. Must be purchased within limited warranty period; surcharges apply after first 12 months. Box date must be current year or 4 prior. <500 hours, pleasure use only.' },
  yamaha_yes: { id: 'yamaha_yes', brand: 'yamaha', name: 'Yamaha Y.E.S.', provider: 'Yamaha Financial Services', deductible: '$0', disclaimer: 'Y.E.S. contracts must be registered within 10 days of retail sale. Suggested retail prices (set prices in FL). Not for commercial/competition use. Models with 5-year factory warranty eligible up to 24 months New Y.E.S. only. Used Y.E.S. only for units sold by Yamaha Dealers to new owners at time of sale.' },
  suzuki_sep: { id: 'suzuki_sep', brand: 'suzuki', name: 'Suzuki Extended Protection', provider: 'Suzuki Motor USA', deductible: '$25', disclaimer: 'Suzuki Extended Protection: $25 deductible. Suzuki outboard engines only. Engine in-service date cannot exceed 8 years from contract purchase. Continental U.S. and Alaska only. No racing/commercial use. Towing/pick-up: up to $50 per occurrence.' },
};

// ── HP / Price Groups ──
export const HP_GROUPS = {
  yamaha: [
    { id: 'y1', label: '2-14 HP', hpMin: 2, hpMax: 14 },
    { id: 'y2', label: '15-29 HP', hpMin: 15, hpMax: 29 },
    { id: 'y3', label: '30-50 HP', hpMin: 30, hpMax: 50 },
    { id: 'y4', label: '51-99 HP', hpMin: 51, hpMax: 99 },
    { id: 'y5', label: '100-149 HP', hpMin: 100, hpMax: 149 },
    { id: 'y6', label: '150-199 HP', hpMin: 150, hpMax: 199 },
    { id: 'y7', label: '200-249 HP', hpMin: 200, hpMax: 249 },
    { id: 'y8', label: '250-300 HP', hpMin: 250, hpMax: 300 },
    { id: 'y9', label: '301-350 HP', hpMin: 301, hpMax: 350 },
    { id: 'y10', label: '425-450 HP', hpMin: 425, hpMax: 450 },
  ],
  mercury: [
    { id: 'mg1', label: '2.5-14.9 HP', hpMin: 2.5, hpMax: 14.9 },
    { id: 'mg2', label: '15-39.9 / 25 Jet', hpMin: 15, hpMax: 39.9 },
    { id: 'mg3', label: '40-74.9 / 35&40 Jet', hpMin: 40, hpMax: 74.9 },
    { id: 'mg4', label: '75-149.9 / 65&80 Jet', hpMin: 75, hpMax: 149.9 },
    { id: 'mg5', label: '105 Jet', hpMin: 105, hpMax: 105 },
    { id: 'mg6', label: '150-199.9 HP', hpMin: 150, hpMax: 199.9 },
    { id: 'mg7', label: '200-299.9 HP', hpMin: 200, hpMax: 299.9 },
    { id: 'mg8', label: '300-399.9 HP', hpMin: 300, hpMax: 399.9 },
    { id: 'mg9', label: '400 HP', hpMin: 400, hpMax: 400 },
    { id: 'mg10', label: '425 HP', hpMin: 425, hpMax: 425 },
    { id: 'mg11', label: '500 HP', hpMin: 500, hpMax: 500 },
    { id: 'mg12', label: '600 HP', hpMin: 600, hpMax: 600 },
  ],
  suzuki: [
    { id: 's1', label: '1-15 HP', hpMin: 1, hpMax: 15 },
    { id: 's2', label: '16-39 HP', hpMin: 16, hpMax: 39 },
    { id: 's3', label: '40-115 HP', hpMin: 40, hpMax: 115 },
    { id: 's4', label: '116-150 HP', hpMin: 116, hpMax: 150 },
    { id: 's5', label: '151-200 HP', hpMin: 151, hpMax: 200 },
    { id: 's6', label: '201-250 HP', hpMin: 201, hpMax: 250 },
    { id: 's7', label: '251-300 HP', hpMin: 251, hpMax: 300 },
    { id: 's8', label: '301-350 HP', hpMin: 301, hpMax: 350 },
  ],
};

// ═══════════════════════════════════════════════════════
// WARRANTY RATES — Exact from source rate sheets
// ═══════════════════════════════════════════════════════
export const WARRANTY_RATES = [
  // ─── YAMAHA Y.E.S. NEW (Retail effective 1/1/2026) ───
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y1', termMonths: 12, termLabel: '12 Months', retailPrice: 205, dealerCost: 105, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y1', termMonths: 24, termLabel: '24 Months', retailPrice: 315, dealerCost: 160, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y1', termMonths: 36, termLabel: '36 Months', retailPrice: 475, dealerCost: 240, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y2', termMonths: 12, termLabel: '12 Months', retailPrice: 295, dealerCost: 150, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y2', termMonths: 24, termLabel: '24 Months', retailPrice: 445, dealerCost: 225, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y2', termMonths: 36, termLabel: '36 Months', retailPrice: 570, dealerCost: 285, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y3', termMonths: 12, termLabel: '12 Months', retailPrice: 350, dealerCost: 175, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y3', termMonths: 24, termLabel: '24 Months', retailPrice: 520, dealerCost: 265, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y3', termMonths: 36, termLabel: '36 Months', retailPrice: 675, dealerCost: 340, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y4', termMonths: 12, termLabel: '12 Months', retailPrice: 605, dealerCost: 305, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y4', termMonths: 24, termLabel: '24 Months', retailPrice: 840, dealerCost: 440, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y4', termMonths: 36, termLabel: '36 Months', retailPrice: 1135, dealerCost: 570, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y5', termMonths: 12, termLabel: '12 Months', retailPrice: 780, dealerCost: 390, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y5', termMonths: 24, termLabel: '24 Months', retailPrice: 925, dealerCost: 510, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y5', termMonths: 36, termLabel: '36 Months', retailPrice: 1260, dealerCost: 630, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y6', termMonths: 12, termLabel: '12 Months', retailPrice: 925, dealerCost: 485, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y6', termMonths: 24, termLabel: '24 Months', retailPrice: 1305, dealerCost: 770, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y6', termMonths: 36, termLabel: '36 Months', retailPrice: 1735, dealerCost: 1040, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y7', termMonths: 12, termLabel: '12 Months', retailPrice: 1445, dealerCost: 855, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y7', termMonths: 24, termLabel: '24 Months', retailPrice: 2080, dealerCost: 1275, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y7', termMonths: 36, termLabel: '36 Months', retailPrice: 2600, dealerCost: 1535, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y8', termMonths: 12, termLabel: '12 Months', retailPrice: 1735, dealerCost: 1085, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y8', termMonths: 24, termLabel: '24 Months', retailPrice: 2660, dealerCost: 1620, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y8', termMonths: 36, termLabel: '36 Months', retailPrice: 3120, dealerCost: 1945, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y9', termMonths: 12, termLabel: '12 Months', retailPrice: 2915, dealerCost: 1880, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y9', termMonths: 24, termLabel: '24 Months', retailPrice: 3630, dealerCost: 2360, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y9', termMonths: 36, termLabel: '36 Months', retailPrice: 4510, dealerCost: 2925, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y10', termMonths: 12, termLabel: '12 Months', retailPrice: 5445, dealerCost: 3020, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y10', termMonths: 24, termLabel: '24 Months', retailPrice: 8470, dealerCost: 4495, effectiveDate: '2026-01-01' },
  // 425-450 has no 36-month new option

  // ─── YAMAHA Y.E.S. USED (Retail effective 1/1/2026) ───
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y1', termMonths: 12, termLabel: '12 Months', retailPrice: 265, dealerCost: 135, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y1', termMonths: 24, termLabel: '24 Months', retailPrice: 370, dealerCost: 185, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y2', termMonths: 12, termLabel: '12 Months', retailPrice: 450, dealerCost: 230, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y2', termMonths: 24, termLabel: '24 Months', retailPrice: 710, dealerCost: 360, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y3', termMonths: 12, termLabel: '12 Months', retailPrice: 735, dealerCost: 370, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y3', termMonths: 24, termLabel: '24 Months', retailPrice: 1155, dealerCost: 580, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y4', termMonths: 12, termLabel: '12 Months', retailPrice: 1120, dealerCost: 595, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y4', termMonths: 24, termLabel: '24 Months', retailPrice: 1550, dealerCost: 765, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y5', termMonths: 12, termLabel: '12 Months', retailPrice: 1315, dealerCost: 725, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y5', termMonths: 24, termLabel: '24 Months', retailPrice: 1910, dealerCost: 1050, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y6', termMonths: 12, termLabel: '12 Months', retailPrice: 1840, dealerCost: 1050, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y6', termMonths: 24, termLabel: '24 Months', retailPrice: 2495, dealerCost: 1445, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y7', termMonths: 12, termLabel: '12 Months', retailPrice: 2625, dealerCost: 1515, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y7', termMonths: 24, termLabel: '24 Months', retailPrice: 3150, dealerCost: 1810, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y8', termMonths: 12, termLabel: '12 Months', retailPrice: 3150, dealerCost: 1910, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y8', termMonths: 24, termLabel: '24 Months', retailPrice: 3745, dealerCost: 2300, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y9', termMonths: 12, termLabel: '12 Months', retailPrice: 3575, dealerCost: 2200, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y9', termMonths: 24, termLabel: '24 Months', retailPrice: 4335, dealerCost: 2685, effectiveDate: '2026-01-01' },
  // 425-450 has no used options

  // ─── MERCURY GOLD OUTBOARD (effective 9/29/2025) ───
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg1', termMonths: 12, termLabel: '1 Year', retailPrice: 52, dealerCost: 26, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg1', termMonths: 24, termLabel: '2 Years', retailPrice: 94, dealerCost: 47, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg1', termMonths: 36, termLabel: '3 Years', retailPrice: 133, dealerCost: 66, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg1', termMonths: 48, termLabel: '4 Years', retailPrice: 169, dealerCost: 85, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg1', termMonths: 60, termLabel: '5 Years', retailPrice: 200, dealerCost: 100, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg2', termMonths: 12, termLabel: '1 Year', retailPrice: 122, dealerCost: 61, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg2', termMonths: 24, termLabel: '2 Years', retailPrice: 218, dealerCost: 110, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg2', termMonths: 36, termLabel: '3 Years', retailPrice: 310, dealerCost: 155, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg2', termMonths: 48, termLabel: '4 Years', retailPrice: 394, dealerCost: 197, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg2', termMonths: 60, termLabel: '5 Years', retailPrice: 468, dealerCost: 234, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg3', termMonths: 12, termLabel: '1 Year', retailPrice: 242, dealerCost: 122, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg3', termMonths: 24, termLabel: '2 Years', retailPrice: 437, dealerCost: 218, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg3', termMonths: 36, termLabel: '3 Years', retailPrice: 618, dealerCost: 310, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg3', termMonths: 48, termLabel: '4 Years', retailPrice: 786, dealerCost: 393, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg3', termMonths: 60, termLabel: '5 Years', retailPrice: 934, dealerCost: 467, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg4', termMonths: 12, termLabel: '1 Year', retailPrice: 369, dealerCost: 185, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg4', termMonths: 24, termLabel: '2 Years', retailPrice: 664, dealerCost: 332, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg4', termMonths: 36, termLabel: '3 Years', retailPrice: 941, dealerCost: 470, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg4', termMonths: 48, termLabel: '4 Years', retailPrice: 1195, dealerCost: 598, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg4', termMonths: 60, termLabel: '5 Years', retailPrice: 1420, dealerCost: 710, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg5', termMonths: 12, termLabel: '1 Year', retailPrice: 462, dealerCost: 231, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg5', termMonths: 24, termLabel: '2 Years', retailPrice: 832, dealerCost: 416, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg5', termMonths: 36, termLabel: '3 Years', retailPrice: 1179, dealerCost: 590, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg5', termMonths: 48, termLabel: '4 Years', retailPrice: 1498, dealerCost: 750, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg5', termMonths: 60, termLabel: '5 Years', retailPrice: 1780, dealerCost: 890, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg6', termMonths: 12, termLabel: '1 Year', retailPrice: 515, dealerCost: 258, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg6', termMonths: 24, termLabel: '2 Years', retailPrice: 928, dealerCost: 464, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg6', termMonths: 36, termLabel: '3 Years', retailPrice: 1314, dealerCost: 657, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg6', termMonths: 48, termLabel: '4 Years', retailPrice: 1670, dealerCost: 835, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg6', termMonths: 60, termLabel: '5 Years', retailPrice: 1983, dealerCost: 992, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg7', termMonths: 12, termLabel: '1 Year', retailPrice: 1237, dealerCost: 618, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg7', termMonths: 24, termLabel: '2 Years', retailPrice: 2226, dealerCost: 1114, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg7', termMonths: 36, termLabel: '3 Years', retailPrice: 3154, dealerCost: 1577, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg7', termMonths: 48, termLabel: '4 Years', retailPrice: 4007, dealerCost: 2004, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg7', termMonths: 60, termLabel: '5 Years', retailPrice: 4762, dealerCost: 2381, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg8', termMonths: 12, termLabel: '1 Year', retailPrice: 1764, dealerCost: 882, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg8', termMonths: 24, termLabel: '2 Years', retailPrice: 3175, dealerCost: 1588, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg8', termMonths: 36, termLabel: '3 Years', retailPrice: 4498, dealerCost: 2250, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg8', termMonths: 48, termLabel: '4 Years', retailPrice: 5715, dealerCost: 2858, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg8', termMonths: 60, termLabel: '5 Years', retailPrice: 6791, dealerCost: 3396, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg9', termMonths: 12, termLabel: '1 Year', retailPrice: 2457, dealerCost: 1229, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg9', termMonths: 24, termLabel: '2 Years', retailPrice: 4422, dealerCost: 2211, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg9', termMonths: 36, termLabel: '3 Years', retailPrice: 6265, dealerCost: 3133, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg9', termMonths: 48, termLabel: '4 Years', retailPrice: 7960, dealerCost: 3980, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg9', termMonths: 60, termLabel: '5 Years', retailPrice: 9458, dealerCost: 4730, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg10', termMonths: 12, termLabel: '1 Year', retailPrice: 2571, dealerCost: 1286, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg10', termMonths: 24, termLabel: '2 Years', retailPrice: 4629, dealerCost: 2314, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg10', termMonths: 36, termLabel: '3 Years', retailPrice: 6557, dealerCost: 3278, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg10', termMonths: 48, termLabel: '4 Years', retailPrice: 8330, dealerCost: 4166, effectiveDate: '2025-09-29' },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'mg10', termMonths: 60, termLabel: '5 Years', retailPrice: 9899, dealerCost: 4950, effectiveDate: '2025-09-29' },

  // ─── MERCURY PLATINUM OUTBOARD (effective 9/29/2025) ───
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg1', termMonths: 12, termLabel: '1 Year', retailPrice: 65, dealerCost: 33, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg1', termMonths: 24, termLabel: '2 Years', retailPrice: 117, dealerCost: 59, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg1', termMonths: 36, termLabel: '3 Years', retailPrice: 166, dealerCost: 83, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg1', termMonths: 48, termLabel: '4 Years', retailPrice: 211, dealerCost: 106, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg1', termMonths: 60, termLabel: '5 Years', retailPrice: 250, dealerCost: 125, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg2', termMonths: 12, termLabel: '1 Year', retailPrice: 152, dealerCost: 76, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg2', termMonths: 24, termLabel: '2 Years', retailPrice: 273, dealerCost: 137, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg2', termMonths: 36, termLabel: '3 Years', retailPrice: 388, dealerCost: 194, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg2', termMonths: 48, termLabel: '4 Years', retailPrice: 492, dealerCost: 246, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg2', termMonths: 60, termLabel: '5 Years', retailPrice: 585, dealerCost: 293, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg3', termMonths: 12, termLabel: '1 Year', retailPrice: 303, dealerCost: 152, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg3', termMonths: 24, termLabel: '2 Years', retailPrice: 546, dealerCost: 273, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg3', termMonths: 36, termLabel: '3 Years', retailPrice: 773, dealerCost: 387, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg3', termMonths: 48, termLabel: '4 Years', retailPrice: 982, dealerCost: 491, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg3', termMonths: 60, termLabel: '5 Years', retailPrice: 1167, dealerCost: 584, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg4', termMonths: 12, termLabel: '1 Year', retailPrice: 461, dealerCost: 231, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg4', termMonths: 24, termLabel: '2 Years', retailPrice: 830, dealerCost: 415, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg4', termMonths: 36, termLabel: '3 Years', retailPrice: 1176, dealerCost: 588, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg4', termMonths: 48, termLabel: '4 Years', retailPrice: 1494, dealerCost: 747, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg4', termMonths: 60, termLabel: '5 Years', retailPrice: 1775, dealerCost: 888, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg5', termMonths: 12, termLabel: '1 Year', retailPrice: 578, dealerCost: 289, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg5', termMonths: 24, termLabel: '2 Years', retailPrice: 1040, dealerCost: 520, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg5', termMonths: 36, termLabel: '3 Years', retailPrice: 1474, dealerCost: 737, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg5', termMonths: 48, termLabel: '4 Years', retailPrice: 1873, dealerCost: 937, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg5', termMonths: 60, termLabel: '5 Years', retailPrice: 2225, dealerCost: 1113, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg6', termMonths: 12, termLabel: '1 Year', retailPrice: 644, dealerCost: 322, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg6', termMonths: 24, termLabel: '2 Years', retailPrice: 1160, dealerCost: 580, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg6', termMonths: 36, termLabel: '3 Years', retailPrice: 1642, dealerCost: 821, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg6', termMonths: 48, termLabel: '4 Years', retailPrice: 2087, dealerCost: 1044, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg6', termMonths: 60, termLabel: '5 Years', retailPrice: 2479, dealerCost: 1240, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg7', termMonths: 12, termLabel: '1 Year', retailPrice: 1546, dealerCost: 773, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg7', termMonths: 24, termLabel: '2 Years', retailPrice: 2783, dealerCost: 1392, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg7', termMonths: 36, termLabel: '3 Years', retailPrice: 3942, dealerCost: 1971, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg7', termMonths: 48, termLabel: '4 Years', retailPrice: 5009, dealerCost: 2505, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg7', termMonths: 60, termLabel: '5 Years', retailPrice: 5952, dealerCost: 2976, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg8', termMonths: 12, termLabel: '1 Year', retailPrice: 2205, dealerCost: 1103, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg8', termMonths: 24, termLabel: '2 Years', retailPrice: 3969, dealerCost: 1985, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg8', termMonths: 36, termLabel: '3 Years', retailPrice: 5623, dealerCost: 2812, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg8', termMonths: 48, termLabel: '4 Years', retailPrice: 7144, dealerCost: 3572, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg8', termMonths: 60, termLabel: '5 Years', retailPrice: 8489, dealerCost: 4245, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg9', termMonths: 12, termLabel: '1 Year', retailPrice: 3071, dealerCost: 1536, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg9', termMonths: 24, termLabel: '2 Years', retailPrice: 5528, dealerCost: 2764, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg9', termMonths: 36, termLabel: '3 Years', retailPrice: 7831, dealerCost: 3916, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg9', termMonths: 48, termLabel: '4 Years', retailPrice: 9950, dealerCost: 4975, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg9', termMonths: 60, termLabel: '5 Years', retailPrice: 11823, dealerCost: 5912, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg10', termMonths: 12, termLabel: '1 Year', retailPrice: 3214, dealerCost: 1607, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg10', termMonths: 24, termLabel: '2 Years', retailPrice: 5786, dealerCost: 2893, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg10', termMonths: 36, termLabel: '3 Years', retailPrice: 8196, dealerCost: 4098, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg10', termMonths: 48, termLabel: '4 Years', retailPrice: 10413, dealerCost: 5207, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg10', termMonths: 60, termLabel: '5 Years', retailPrice: 12374, dealerCost: 6187, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg11', termMonths: 12, termLabel: '1 Year', retailPrice: 4162, dealerCost: 2081, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg11', termMonths: 24, termLabel: '2 Years', retailPrice: 7492, dealerCost: 3746, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg11', termMonths: 36, termLabel: '3 Years', retailPrice: 10613, dealerCost: 5307, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg11', termMonths: 48, termLabel: '4 Years', retailPrice: 13485, dealerCost: 6743, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg11', termMonths: 60, termLabel: '5 Years', retailPrice: 16024, dealerCost: 8012, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg12', termMonths: 12, termLabel: '1 Year', retailPrice: 4988, dealerCost: 2494, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg12', termMonths: 24, termLabel: '2 Years', retailPrice: 8978, dealerCost: 4489, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg12', termMonths: 36, termLabel: '3 Years', retailPrice: 12719, dealerCost: 6360, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg12', termMonths: 48, termLabel: '4 Years', retailPrice: 16161, dealerCost: 8081, effectiveDate: '2025-09-29' },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'mg12', termMonths: 60, termLabel: '5 Years', retailPrice: 19204, dealerCost: 9602, effectiveDate: '2025-09-29' },

  // ─── SUZUKI NEW OUTBOARD (effective 2/1/2023) ───
  // Terms are TOTAL months including 60-month factory warranty
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's1', termMonths: 72, termLabel: '72 Mo Total (Mfg+12)', retailPrice: 154, dealerCost: 77, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's1', termMonths: 84, termLabel: '84 Mo Total (Mfg+24)', retailPrice: 204, dealerCost: 102, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's1', termMonths: 96, termLabel: '96 Mo Total (Mfg+36)', retailPrice: 254, dealerCost: 127, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's2', termMonths: 72, termLabel: '72 Mo Total (Mfg+12)', retailPrice: 236, dealerCost: 118, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's2', termMonths: 84, termLabel: '84 Mo Total (Mfg+24)', retailPrice: 304, dealerCost: 152, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's2', termMonths: 96, termLabel: '96 Mo Total (Mfg+36)', retailPrice: 370, dealerCost: 185, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's3', termMonths: 72, termLabel: '72 Mo Total (Mfg+12)', retailPrice: 344, dealerCost: 172, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's3', termMonths: 84, termLabel: '84 Mo Total (Mfg+24)', retailPrice: 454, dealerCost: 227, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's3', termMonths: 96, termLabel: '96 Mo Total (Mfg+36)', retailPrice: 560, dealerCost: 280, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's4', termMonths: 72, termLabel: '72 Mo Total (Mfg+12)', retailPrice: 540, dealerCost: 270, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's4', termMonths: 84, termLabel: '84 Mo Total (Mfg+24)', retailPrice: 708, dealerCost: 354, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's4', termMonths: 96, termLabel: '96 Mo Total (Mfg+36)', retailPrice: 868, dealerCost: 434, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's5', termMonths: 72, termLabel: '72 Mo Total (Mfg+12)', retailPrice: 794, dealerCost: 397, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's5', termMonths: 84, termLabel: '84 Mo Total (Mfg+24)', retailPrice: 1130, dealerCost: 565, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's5', termMonths: 96, termLabel: '96 Mo Total (Mfg+36)', retailPrice: 1446, dealerCost: 723, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's6', termMonths: 72, termLabel: '72 Mo Total (Mfg+12)', retailPrice: 1154, dealerCost: 577, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's6', termMonths: 84, termLabel: '84 Mo Total (Mfg+24)', retailPrice: 1722, dealerCost: 861, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's6', termMonths: 96, termLabel: '96 Mo Total (Mfg+36)', retailPrice: 2254, dealerCost: 1127, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's7', termMonths: 72, termLabel: '72 Mo Total (Mfg+12)', retailPrice: 1684, dealerCost: 842, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's7', termMonths: 84, termLabel: '84 Mo Total (Mfg+24)', retailPrice: 2650, dealerCost: 1325, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's7', termMonths: 96, termLabel: '96 Mo Total (Mfg+36)', retailPrice: 3554, dealerCost: 1777, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's8', termMonths: 72, termLabel: '72 Mo Total (Mfg+12)', retailPrice: 2186, dealerCost: 1093, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's8', termMonths: 84, termLabel: '84 Mo Total (Mfg+24)', retailPrice: 3520, dealerCost: 1760, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's8', termMonths: 96, termLabel: '96 Mo Total (Mfg+36)', retailPrice: 4768, dealerCost: 2384, effectiveDate: '2023-02-01' },

  // ─── SUZUKI USED OUTBOARD (effective 2/1/2023) ───
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's1', termMonths: 12, termLabel: '12 Months', retailPrice: 244, dealerCost: 122, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's1', termMonths: 24, termLabel: '24 Months', retailPrice: 294, dealerCost: 147, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's2', termMonths: 12, termLabel: '12 Months', retailPrice: 344, dealerCost: 172, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's2', termMonths: 24, termLabel: '24 Months', retailPrice: 410, dealerCost: 205, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's3', termMonths: 12, termLabel: '12 Months', retailPrice: 494, dealerCost: 247, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's3', termMonths: 24, termLabel: '24 Months', retailPrice: 600, dealerCost: 300, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's4', termMonths: 12, termLabel: '12 Months', retailPrice: 748, dealerCost: 374, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's4', termMonths: 24, termLabel: '24 Months', retailPrice: 908, dealerCost: 454, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's5', termMonths: 12, termLabel: '12 Months', retailPrice: 1170, dealerCost: 585, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's5', termMonths: 24, termLabel: '24 Months', retailPrice: 1486, dealerCost: 743, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's6', termMonths: 12, termLabel: '12 Months', retailPrice: 1762, dealerCost: 881, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's6', termMonths: 24, termLabel: '24 Months', retailPrice: 2294, dealerCost: 1147, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's7', termMonths: 12, termLabel: '12 Months', retailPrice: 2690, dealerCost: 1345, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's7', termMonths: 24, termLabel: '24 Months', retailPrice: 3594, dealerCost: 1797, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's8', termMonths: 12, termLabel: '12 Months', retailPrice: 3560, dealerCost: 1780, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's8', termMonths: 24, termLabel: '24 Months', retailPrice: 4808, dealerCost: 2404, effectiveDate: '2023-02-01' },
];

// ── Lookup Helpers ──

export function getPlansForBrand(brandId) {
  const brand = WARRANTY_BRANDS.find((b) => b.id === brandId);
  if (!brand) return [];
  return brand.plans.map((pid) => WARRANTY_PLANS[pid]).filter(Boolean);
}

export function getHPGroupsForBrand(brandId) {
  return HP_GROUPS[brandId] || [];
}

export function getAvailableTerms(planId, condition, hpGroupId) {
  return WARRANTY_RATES
    .filter((r) => r.plan === planId && r.condition === condition && r.hpGroup === hpGroupId)
    .sort((a, b) => a.termMonths - b.termMonths);
}

export function lookupWarrantyRate(planId, condition, hpGroupId, termMonths) {
  return WARRANTY_RATES.find((r) =>
    r.plan === planId && r.condition === condition && r.hpGroup === hpGroupId && r.termMonths === termMonths
  ) || null;
}

export function applyWarrantySurcharge(rate, surchargeKey) {
  if (!surchargeKey || !SURCHARGE_RULES[surchargeKey]) return { retailPrice: rate.retailPrice, dealerCost: rate.dealerCost };
  const rule = SURCHARGE_RULES[surchargeKey];
  return {
    retailPrice: rate.retailPrice + rule.amount,
    dealerCost: rate.dealerCost + Math.round(rule.amount / 2),
    surchargeApplied: rule.label,
    surchargeAmount: rule.amount,
  };
}

export function warrantyRateToFIProduct(rate, planId, surchargeKey) {
  const plan = WARRANTY_PLANS[planId];
  if (!plan || !rate) return null;
  const adjusted = surchargeKey ? applyWarrantySurcharge(rate, surchargeKey) : { retailPrice: rate.retailPrice, dealerCost: rate.dealerCost };
  return {
    productId: `warranty_${planId}_${rate.hpGroup}_${rate.termMonths}`,
    name: `${plan.name} — ${rate.termLabel}`,
    retailPrice: adjusted.retailPrice,
    cost: adjusted.dealerCost,
    financeable: true,
    taxable: false,
    accepted: null,
    declined: false,
    notes: adjusted.surchargeApplied ? `Surcharge: ${adjusted.surchargeApplied} (+$${adjusted.surchargeAmount})` : '',
    _isWarranty: true,
    _planId: planId,
    _brandId: plan.brand,
    _hpGroup: rate.hpGroup,
    _termMonths: rate.termMonths,
    _disclaimer: plan.disclaimer,
    _deductible: plan.deductible,
  };
}
