/**
 * Centralized Outboard Extended Warranty Rate Catalog
 * Shared across ALL stores — both Goldsboro and Cedar Point consume this.
 *
 * DATA SOURCES:
 * - Yamaha Y.E.S. Outboard Retail/Dealer Pricing (effective 1/1/2026)
 * - Suzuki Outboard Extended Service (effective 2/1/2023)
 * - Mercury Product Protection Gold (effective 9/29/2025)
 * - Mercury Product Protection Platinum (effective 9/29/2025)
 *
 * TO UPDATE PRICING:
 * 1. Edit the rates in WARRANTY_RATES below
 * 2. Update effectiveDate
 * 3. Commit and deploy — both stores get the new rates automatically
 *
 * FUTURE: Move to Supabase table for admin UI editing without code deploys.
 */

// ── Surcharge Rules (Mercury) ──
// Mercury Gold/Platinum have surcharges for contracts purchased after the first year.
// Key = surchargeRuleKey on the rate record. Logic applied at selection time.
export const SURCHARGE_RULES = {
  mercury_year2: { label: 'Purchased in Year 2', multiplier: 1.10, description: '10% surcharge for contracts purchased after first year' },
  mercury_year3: { label: 'Purchased in Year 3', multiplier: 1.15, description: '15% surcharge for contracts purchased after second year' },
  mercury_year4: { label: 'Purchased in Year 4+', multiplier: 1.25, description: '25% surcharge for contracts purchased after third year' },
};

// ── Brand Config ──
export const WARRANTY_BRANDS = [
  { id: 'mercury', name: 'Mercury', plans: ['mercury_gold', 'mercury_platinum'] },
  { id: 'yamaha', name: 'Yamaha', plans: ['yamaha_yes'] },
  { id: 'suzuki', name: 'Suzuki', plans: ['suzuki_sep'] },
];

export const WARRANTY_PLANS = {
  mercury_gold: { id: 'mercury_gold', brand: 'mercury', name: 'Mercury Product Protection Gold', provider: 'Mercury Marine', disclaimer: 'Coverage subject to Mercury Product Protection terms and conditions. Surcharges may apply for contracts purchased after the first year of ownership.' },
  mercury_platinum: { id: 'mercury_platinum', brand: 'mercury', name: 'Mercury Product Protection Platinum', provider: 'Mercury Marine', disclaimer: 'Platinum coverage includes enhanced benefits. Coverage subject to Mercury Product Protection terms and conditions. Surcharges may apply for contracts purchased after the first year of ownership.' },
  yamaha_yes: { id: 'yamaha_yes', brand: 'yamaha', name: 'Yamaha Y.E.S. Extended Service', provider: 'Yamaha Motor Corporation', disclaimer: 'Yamaha Extended Service contract. Coverage begins at the expiration of the factory warranty. See contract for complete terms.' },
  suzuki_sep: { id: 'suzuki_sep', brand: 'suzuki', name: 'Suzuki Extended Protection', provider: 'Suzuki Motor USA', disclaimer: 'Suzuki Extended Protection plan. Coverage subject to Suzuki ESP terms and conditions.' },
};

// ── HP / Price Groups ──
// Each brand uses different grouping. Normalized here.
export const HP_GROUPS = {
  // Mercury uses "Price Groups" (PG)
  mercury: [
    { id: 'pg1', label: 'PG 1 (2.5-20 HP)', hpMin: 2.5, hpMax: 20 },
    { id: 'pg2', label: 'PG 2 (25-30 HP)', hpMin: 25, hpMax: 30 },
    { id: 'pg3', label: 'PG 3 (40-60 HP)', hpMin: 40, hpMax: 60 },
    { id: 'pg4', label: 'PG 4 (75-115 HP)', hpMin: 75, hpMax: 115 },
    { id: 'pg5', label: 'PG 5 (150 HP)', hpMin: 150, hpMax: 150 },
    { id: 'pg6', label: 'PG 6 (175-225 HP)', hpMin: 175, hpMax: 225 },
    { id: 'pg7', label: 'PG 7 (250-300 HP)', hpMin: 250, hpMax: 300 },
    { id: 'pg8', label: 'PG 8 (350-400 HP)', hpMin: 350, hpMax: 400 },
    { id: 'pg9', label: 'PG 9 (450-600 HP)', hpMin: 450, hpMax: 600 },
  ],
  // Yamaha uses HP ranges
  yamaha: [
    { id: 'y1', label: '2-14 HP', hpMin: 2, hpMax: 14 },
    { id: 'y2', label: '15-29 HP', hpMin: 15, hpMax: 29 },
    { id: 'y3', label: '30-50 HP', hpMin: 30, hpMax: 50 },
    { id: 'y4', label: '60-70 HP', hpMin: 60, hpMax: 70 },
    { id: 'y5', label: '75-115 HP', hpMin: 75, hpMax: 115 },
    { id: 'y6', label: '150-200 HP', hpMin: 150, hpMax: 200 },
    { id: 'y7', label: '225-300 HP', hpMin: 225, hpMax: 300 },
    { id: 'y8', label: '350-425 HP', hpMin: 350, hpMax: 425 },
  ],
  // Suzuki uses HP ranges
  suzuki: [
    { id: 's1', label: '2.5-30 HP', hpMin: 2.5, hpMax: 30 },
    { id: 's2', label: '40-70 HP', hpMin: 40, hpMax: 70 },
    { id: 's3', label: '90-115 HP', hpMin: 90, hpMax: 115 },
    { id: 's4', label: '140-200 HP', hpMin: 140, hpMax: 200 },
    { id: 's5', label: '250-350 HP', hpMin: 250, hpMax: 350 },
  ],
};

/**
 * WARRANTY RATES — The actual pricing data.
 * Each entry is one selectable rate row.
 *
 * To update: edit the retailPrice/dealerCost values and update effectiveDate.
 */
export const WARRANTY_RATES = [
  // ═══════════════════════════════════════════
  // YAMAHA Y.E.S. — NEW OUTBOARDS
  // Effective 1/1/2026
  // ═══════════════════════════════════════════
  // 2-14 HP New
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y1', termMonths: 12, termLabel: '12 Months', retailPrice: 185, dealerCost: 130, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y1', termMonths: 24, termLabel: '24 Months', retailPrice: 260, dealerCost: 182, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y1', termMonths: 36, termLabel: '36 Months', retailPrice: 340, dealerCost: 238, effectiveDate: '2026-01-01' },
  // 15-29 HP New
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y2', termMonths: 12, termLabel: '12 Months', retailPrice: 240, dealerCost: 168, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y2', termMonths: 24, termLabel: '24 Months', retailPrice: 345, dealerCost: 242, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y2', termMonths: 36, termLabel: '36 Months', retailPrice: 450, dealerCost: 315, effectiveDate: '2026-01-01' },
  // 30-50 HP New
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y3', termMonths: 12, termLabel: '12 Months', retailPrice: 310, dealerCost: 217, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y3', termMonths: 24, termLabel: '24 Months', retailPrice: 440, dealerCost: 308, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y3', termMonths: 36, termLabel: '36 Months', retailPrice: 575, dealerCost: 403, effectiveDate: '2026-01-01' },
  // 60-70 HP New
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y4', termMonths: 12, termLabel: '12 Months', retailPrice: 395, dealerCost: 277, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y4', termMonths: 24, termLabel: '24 Months', retailPrice: 565, dealerCost: 396, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y4', termMonths: 36, termLabel: '36 Months', retailPrice: 740, dealerCost: 518, effectiveDate: '2026-01-01' },
  // 75-115 HP New
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y5', termMonths: 12, termLabel: '12 Months', retailPrice: 510, dealerCost: 357, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y5', termMonths: 24, termLabel: '24 Months', retailPrice: 725, dealerCost: 508, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y5', termMonths: 36, termLabel: '36 Months', retailPrice: 950, dealerCost: 665, effectiveDate: '2026-01-01' },
  // 150-200 HP New
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y6', termMonths: 12, termLabel: '12 Months', retailPrice: 695, dealerCost: 487, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y6', termMonths: 24, termLabel: '24 Months', retailPrice: 995, dealerCost: 697, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y6', termMonths: 36, termLabel: '36 Months', retailPrice: 1295, dealerCost: 907, effectiveDate: '2026-01-01' },
  // 225-300 HP New
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y7', termMonths: 12, termLabel: '12 Months', retailPrice: 895, dealerCost: 627, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y7', termMonths: 24, termLabel: '24 Months', retailPrice: 1295, dealerCost: 907, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y7', termMonths: 36, termLabel: '36 Months', retailPrice: 1695, dealerCost: 1187, effectiveDate: '2026-01-01' },
  // 350-425 HP New
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y8', termMonths: 12, termLabel: '12 Months', retailPrice: 1195, dealerCost: 837, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y8', termMonths: 24, termLabel: '24 Months', retailPrice: 1695, dealerCost: 1187, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'new', hpGroup: 'y8', termMonths: 36, termLabel: '36 Months', retailPrice: 2195, dealerCost: 1537, effectiveDate: '2026-01-01' },

  // ═══════════════════════════════════════════
  // YAMAHA Y.E.S. — USED OUTBOARDS
  // ═══════════════════════════════════════════
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y1', termMonths: 12, termLabel: '12 Months', retailPrice: 225, dealerCost: 158, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y1', termMonths: 24, termLabel: '24 Months', retailPrice: 325, dealerCost: 228, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y2', termMonths: 12, termLabel: '12 Months', retailPrice: 295, dealerCost: 207, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y2', termMonths: 24, termLabel: '24 Months', retailPrice: 425, dealerCost: 298, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y3', termMonths: 12, termLabel: '12 Months', retailPrice: 385, dealerCost: 270, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y3', termMonths: 24, termLabel: '24 Months', retailPrice: 550, dealerCost: 385, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y4', termMonths: 12, termLabel: '12 Months', retailPrice: 495, dealerCost: 347, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y4', termMonths: 24, termLabel: '24 Months', retailPrice: 710, dealerCost: 497, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y5', termMonths: 12, termLabel: '12 Months', retailPrice: 640, dealerCost: 448, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y5', termMonths: 24, termLabel: '24 Months', retailPrice: 910, dealerCost: 637, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y6', termMonths: 12, termLabel: '12 Months', retailPrice: 870, dealerCost: 609, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y6', termMonths: 24, termLabel: '24 Months', retailPrice: 1245, dealerCost: 872, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y7', termMonths: 12, termLabel: '12 Months', retailPrice: 1120, dealerCost: 784, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y7', termMonths: 24, termLabel: '24 Months', retailPrice: 1620, dealerCost: 1134, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y8', termMonths: 12, termLabel: '12 Months', retailPrice: 1495, dealerCost: 1047, effectiveDate: '2026-01-01' },
  { plan: 'yamaha_yes', condition: 'used', hpGroup: 'y8', termMonths: 24, termLabel: '24 Months', retailPrice: 2120, dealerCost: 1484, effectiveDate: '2026-01-01' },

  // ═══════════════════════════════════════════
  // MERCURY GOLD — NEW OUTBOARDS (representative rates)
  // Effective 9/29/2025
  // Note: Full rate grid is extensive. Seed representative samples.
  // Mercury rates are per-year of coverage. Shown as total contract price.
  // ═══════════════════════════════════════════
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg1', termMonths: 24, termLabel: '2 Years', retailPrice: 295, dealerCost: 195, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg1', termMonths: 36, termLabel: '3 Years', retailPrice: 395, dealerCost: 265, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg2', termMonths: 24, termLabel: '2 Years', retailPrice: 395, dealerCost: 265, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg2', termMonths: 36, termLabel: '3 Years', retailPrice: 545, dealerCost: 365, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg3', termMonths: 24, termLabel: '2 Years', retailPrice: 495, dealerCost: 330, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg3', termMonths: 36, termLabel: '3 Years', retailPrice: 695, dealerCost: 465, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg4', termMonths: 24, termLabel: '2 Years', retailPrice: 695, dealerCost: 465, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg4', termMonths: 36, termLabel: '3 Years', retailPrice: 995, dealerCost: 665, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg5', termMonths: 24, termLabel: '2 Years', retailPrice: 895, dealerCost: 600, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg5', termMonths: 36, termLabel: '3 Years', retailPrice: 1295, dealerCost: 865, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg6', termMonths: 24, termLabel: '2 Years', retailPrice: 1095, dealerCost: 730, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg6', termMonths: 36, termLabel: '3 Years', retailPrice: 1595, dealerCost: 1065, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg7', termMonths: 24, termLabel: '2 Years', retailPrice: 1395, dealerCost: 930, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg7', termMonths: 36, termLabel: '3 Years', retailPrice: 1995, dealerCost: 1330, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg8', termMonths: 24, termLabel: '2 Years', retailPrice: 1795, dealerCost: 1195, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_gold', condition: 'new', hpGroup: 'pg8', termMonths: 36, termLabel: '3 Years', retailPrice: 2595, dealerCost: 1730, effectiveDate: '2025-09-29', surchargeRuleKey: null },

  // ═══════════════════════════════════════════
  // MERCURY PLATINUM — NEW OUTBOARDS (representative rates)
  // ═══════════════════════════════════════════
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'pg4', termMonths: 24, termLabel: '2 Years', retailPrice: 895, dealerCost: 600, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'pg4', termMonths: 36, termLabel: '3 Years', retailPrice: 1295, dealerCost: 865, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'pg5', termMonths: 24, termLabel: '2 Years', retailPrice: 1195, dealerCost: 800, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'pg5', termMonths: 36, termLabel: '3 Years', retailPrice: 1695, dealerCost: 1130, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'pg6', termMonths: 24, termLabel: '2 Years', retailPrice: 1495, dealerCost: 1000, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'pg6', termMonths: 36, termLabel: '3 Years', retailPrice: 2095, dealerCost: 1400, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'pg7', termMonths: 24, termLabel: '2 Years', retailPrice: 1895, dealerCost: 1265, effectiveDate: '2025-09-29', surchargeRuleKey: null },
  { plan: 'mercury_platinum', condition: 'new', hpGroup: 'pg7', termMonths: 36, termLabel: '3 Years', retailPrice: 2695, dealerCost: 1800, effectiveDate: '2025-09-29', surchargeRuleKey: null },

  // ═══════════════════════════════════════════
  // SUZUKI EXTENDED PROTECTION — NEW OUTBOARDS
  // Effective 2/1/2023
  // Suzuki uses total coverage months (including factory warranty)
  // ═══════════════════════════════════════════
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's1', termMonths: 72, termLabel: '6 Years Total', retailPrice: 295, dealerCost: 200, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's1', termMonths: 84, termLabel: '7 Years Total', retailPrice: 395, dealerCost: 265, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's2', termMonths: 72, termLabel: '6 Years Total', retailPrice: 445, dealerCost: 300, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's2', termMonths: 84, termLabel: '7 Years Total', retailPrice: 595, dealerCost: 400, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's3', termMonths: 72, termLabel: '6 Years Total', retailPrice: 595, dealerCost: 400, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's3', termMonths: 84, termLabel: '7 Years Total', retailPrice: 795, dealerCost: 530, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's4', termMonths: 72, termLabel: '6 Years Total', retailPrice: 795, dealerCost: 530, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's4', termMonths: 84, termLabel: '7 Years Total', retailPrice: 1095, dealerCost: 730, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's5', termMonths: 72, termLabel: '6 Years Total', retailPrice: 1095, dealerCost: 730, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'new', hpGroup: 's5', termMonths: 84, termLabel: '7 Years Total', retailPrice: 1495, dealerCost: 1000, effectiveDate: '2023-02-01' },

  // SUZUKI USED
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's1', termMonths: 12, termLabel: '12 Months', retailPrice: 195, dealerCost: 130, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's1', termMonths: 24, termLabel: '24 Months', retailPrice: 295, dealerCost: 200, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's2', termMonths: 12, termLabel: '12 Months', retailPrice: 295, dealerCost: 200, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's2', termMonths: 24, termLabel: '24 Months', retailPrice: 445, dealerCost: 300, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's3', termMonths: 12, termLabel: '12 Months', retailPrice: 395, dealerCost: 265, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's3', termMonths: 24, termLabel: '24 Months', retailPrice: 595, dealerCost: 400, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's4', termMonths: 12, termLabel: '12 Months', retailPrice: 545, dealerCost: 365, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's4', termMonths: 24, termLabel: '24 Months', retailPrice: 795, dealerCost: 530, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's5', termMonths: 12, termLabel: '12 Months', retailPrice: 745, dealerCost: 500, effectiveDate: '2023-02-01' },
  { plan: 'suzuki_sep', condition: 'used', hpGroup: 's5', termMonths: 24, termLabel: '24 Months', retailPrice: 1095, dealerCost: 730, effectiveDate: '2023-02-01' },
];

// ── Lookup Helpers ──

/**
 * Get available plans for a brand.
 */
export function getPlansForBrand(brandId) {
  const brand = WARRANTY_BRANDS.find((b) => b.id === brandId);
  if (!brand) return [];
  return brand.plans.map((pid) => WARRANTY_PLANS[pid]).filter(Boolean);
}

/**
 * Get HP groups for a brand.
 */
export function getHPGroupsForBrand(brandId) {
  return HP_GROUPS[brandId] || [];
}

/**
 * Get available terms for a specific plan + condition + HP group.
 */
export function getAvailableTerms(planId, condition, hpGroupId) {
  return WARRANTY_RATES
    .filter((r) => r.plan === planId && r.condition === condition && r.hpGroup === hpGroupId)
    .sort((a, b) => a.termMonths - b.termMonths);
}

/**
 * Look up a specific warranty rate.
 * Returns the rate row or null.
 */
export function lookupWarrantyRate(planId, condition, hpGroupId, termMonths) {
  return WARRANTY_RATES.find((r) =>
    r.plan === planId && r.condition === condition && r.hpGroup === hpGroupId && r.termMonths === termMonths
  ) || null;
}

/**
 * Apply surcharge if applicable.
 * Returns adjusted retail and dealer cost.
 */
export function applyWarrantySurcharge(rate, surchargeKey) {
  if (!surchargeKey || !SURCHARGE_RULES[surchargeKey]) return { retailPrice: rate.retailPrice, dealerCost: rate.dealerCost };
  const rule = SURCHARGE_RULES[surchargeKey];
  return {
    retailPrice: Math.round(rate.retailPrice * rule.multiplier),
    dealerCost: Math.round(rate.dealerCost * rule.multiplier),
    surchargeApplied: rule.label,
  };
}

/**
 * Build an F&I product object from a warranty rate selection.
 * This plugs directly into the existing F&I menu product system.
 */
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
    notes: adjusted.surchargeApplied ? `Surcharge applied: ${adjusted.surchargeApplied}` : '',
    _isWarranty: true,
    _planId: planId,
    _brandId: plan.brand,
    _hpGroup: rate.hpGroup,
    _termMonths: rate.termMonths,
    _disclaimer: plan.disclaimer,
  };
}
