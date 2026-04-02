/* ── Unit Types & Colors ── */
export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export const UNIT_TYPES = ['ATV', 'SXS', 'PWC', 'BOAT', 'TRAILER', 'YOUTH'];

export const UNIT_COLORS = {
  ATV: '#b91c1c',
  SXS: '#16a34a',
  PWC: '#2563eb',
  BOAT: '#d97706',
  TRAILER: '#7c3aed',
  YOUTH: '#ec4899',
};

export const LEAD_SOURCES = ['WEBSITE', 'FACEBOOK', 'OTHER'];

// Delivery checklist items — ordered by workflow sequence
export const STAR_CHECKLIST = [
  { id: 'partsIntro', label: 'Parts Department Introduction', requiresSignoff: true, signoffRole: 'parts' },
  { id: 'serviceIntro', label: 'Service Department Introduction', requiresSignoff: true, signoffRole: 'service' },
  { id: 'deliveryPhoto', label: 'Customer Delivery Photo' },
  { id: 'formatNotes', label: 'FORMAT Notes (2+ Details)' },
  { id: 'googleReview', label: 'Google Review Requested' },
  { id: 'referralRequest', label: 'Referral Request Completed' },
  { id: 'postSaleFollowUp', label: '7-Day Post-Sale Follow-Up', deferred: true },
];

// Star level requirements — cumulative
// 1-Star: deliveryPhoto 100% + formatNotes 100%
// 2-Star: all 1-star + googleReviews >= 3 + postSaleFollowUp 100% + partsIntro 100% + serviceIntro 100%
// 3-Star: all 2-star + googleReviews >= 5 + referralRequest 100%
export const STAR_LEVELS = [
  { star: 1, label: '1-Star', commission: '13%', color: '#2563eb',
    perDeal: ['deliveryPhoto', 'formatNotes'],
    googleReviews: 0 },
  { star: 2, label: '2-Star', commission: '14%', color: '#d97706',
    perDeal: ['deliveryPhoto', 'formatNotes', 'postSaleFollowUp', 'partsIntro', 'serviceIntro'],
    googleReviews: 3 },
  { star: 3, label: '3-Star', commission: '15%', color: '#16a34a',
    perDeal: ['deliveryPhoto', 'formatNotes', 'postSaleFollowUp', 'partsIntro', 'serviceIntro', 'referralRequest'],
    googleReviews: 5 },
];

export const BACK_END_PRODUCTS = [
  'EXTENDED WARRANTY',
  'LIFETIME OIL CHANGE',
  'GAP',
  'LIFETIME BATTERY',
];

/* ── Default Data ── */
export const DEFAULT_SALESPEOPLE = [
  { id: 'taylor', name: 'Taylor Williams', active: true },
  { id: 'chris', name: 'Chris Ipock', active: true },
  { id: 'joey', name: 'Joey Lombardo', active: true },
  { id: 'bryant', name: 'Bryant Ferrell', active: true },
  { id: 'john', name: 'John Vernon', active: true },
];

export const DEFAULT_GOALS = {
  ATV: { target: 40, stretch: 45, payout: 250, stretchPayout: 500 },
  SXS: { target: 45, stretch: 50, payout: 250, stretchPayout: 500 },
  PWC: { target: 12, stretch: 14, payout: 400, stretchPayout: 800 },
  BOAT: { target: 12, stretch: 14, payout: 400, stretchPayout: 800 },
  TRAILER: { target: 15, stretch: 17, payout: 300, stretchPayout: 600 },
  YOUTH: { target: 10, stretch: 12, payout: 200, stretchPayout: 400 },
};

export const DEFAULT_PGA_TIERS = [
  { min: 1000, max: 2500, amount: 25 },
  { min: 2501, max: 5000, amount: 50 },
  { min: 5001, max: 7500, amount: 100 },
  { min: 7501, max: 10000, amount: 200 },
  { min: 10001, max: 999999, amount: 300 },
];

export const DEFAULT_BE_SPIFFS = [
  { product: 'EXTENDED WARRANTY', amount: 20 },
  { product: 'LIFETIME OIL CHANGE', amount: 25 },
  { product: 'GAP', amount: 15 },
  { product: 'LIFETIME BATTERY', amount: 15 },
  { product: 'ALL OF THE ABOVE', amount: 100 },
];
