/**
 * Promo/Pricing-to-Inventory Matching Engine
 * Evaluates each inventory unit against published promos and pricing records.
 * Returns match results with confidence levels and opportunity scores.
 *
 * ASSUMPTIONS:
 * - Inventory is from daily DMS uploads (not live-synced)
 * - Promo data is manually uploaded and reviewed before publishing
 * - Payment estimates use standard amortization (not lender-specific)
 * - Scores are transparent and configurable
 */

import { calcFloorplanDays } from './inventoryConstants';
import { calcMonthlyPayment } from './fiMenuCalc';

// ── Match Confidence Levels ──
export const MATCH_CONFIDENCE = {
  exact: { label: 'EXACT MATCH', color: '#16a34a', score: 1.0 },
  probable: { label: 'PROBABLE', color: '#2563eb', score: 0.75 },
  partial: { label: 'PARTIAL', color: '#d97706', score: 0.5 },
  none: { label: 'NO MATCH', color: '#6b7280', score: 0 },
  review: { label: 'NEEDS REVIEW', color: '#dc2626', score: 0.25 },
};

// ── Scoring Weights (configurable) ──
// Each weight is 0-100 points contribution to total opportunity score
export const SCORING_WEIGHTS = {
  hasPromoAPR: 25,          // Unit qualifies for promotional APR
  hasRebate: 20,            // Unit qualifies for rebate/customer cash
  hasCustomerCash: 15,      // Customer cash incentive available
  hasPricingRecord: 10,     // Published pricing record exists
  promoExpiringDays: 15,    // Urgency bonus: promo expiring within 14 days
  agedInventoryBonus: 10,   // Aged 60+ days gets priority
  carryoverYearBonus: 5,    // Prior model year gets push priority
  // Penalties
  noPromoSupport: -10,      // No matching promo found
  ambiguousMatch: -5,       // Match confidence is partial/review
  missingData: -5,          // Key fields missing on inventory or promo
};

/**
 * Match a single inventory unit against all published promos.
 * Returns array of match results.
 */
export function matchUnitToPromos(unit, promos) {
  const results = [];
  const now = new Date().toISOString().split('T')[0];

  for (const promo of promos) {
    if (promo.status !== 'published') continue;
    if (promo.effectiveEnd && promo.effectiveEnd < now) continue;
    if (promo.effectiveStart && promo.effectiveStart > now) continue;

    const match = evaluatePromoMatch(unit, promo);
    if (match.confidence !== 'none') {
      results.push({
        promoId: promo.id,
        promoName: promo.programName,
        promoBrand: promo.brand,
        promoType: promo.type,
        confidence: match.confidence,
        confidenceScore: MATCH_CONFIDENCE[match.confidence].score,
        reasons: match.reasons,
        warnings: match.warnings,
        // Promo details for quick access
        aprRate: promo.aprRate,
        aprTerm: promo.aprTerm,
        rebateAmount: promo.rebateAmount,
        customerCash: promo.customerCash,
        effectiveEnd: promo.effectiveEnd,
        daysUntilExpiry: promo.effectiveEnd ? Math.max(0, Math.floor((new Date(promo.effectiveEnd) - new Date()) / 86400000)) : null,
      });
    }
  }

  return results.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/**
 * Match a single inventory unit against pricing records.
 */
export function matchUnitToPricing(unit, pricingRecords) {
  const results = [];

  for (const pr of pricingRecords) {
    if (pr.status !== 'published') continue;

    const match = evaluatePricingMatch(unit, pr);
    if (match.confidence !== 'none') {
      results.push({
        pricingId: pr.id,
        confidence: match.confidence,
        confidenceScore: MATCH_CONFIDENCE[match.confidence].score,
        reasons: match.reasons,
        msrp: pr.msrp,
        freight: pr.freight,
        setup: pr.setup,
        suggestedSalePrice: pr.suggestedSalePrice,
      });
    }
  }

  return results.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

/**
 * Evaluate match between one unit and one promo.
 */
function evaluatePromoMatch(unit, promo) {
  const reasons = [];
  const warnings = [];
  let matchPoints = 0;
  let maxPoints = 0;

  // Brand match
  if (promo.brand) {
    maxPoints += 3;
    const unitBrand = (unit.make || '').toLowerCase();
    const promoBrand = promo.brand.toLowerCase().replace(/\s*\(.*\)/, ''); // Remove "(BRP)" etc
    if (unitBrand.includes(promoBrand) || promoBrand.includes(unitBrand)) {
      matchPoints += 3;
      reasons.push(`Brand match: ${unit.make}`);
    } else {
      warnings.push(`Brand mismatch: unit is ${unit.make}, promo is ${promo.brand}`);
    }
  }

  // Store match
  if (promo.storeIds?.length > 0) {
    maxPoints += 2;
    if (promo.storeIds.includes(unit.storeId)) {
      matchPoints += 2;
      reasons.push('Store applicable');
    } else {
      return { confidence: 'none', reasons: [], warnings: ['Store not applicable'] };
    }
  }

  // Category match
  if (promo.categories?.length > 0) {
    maxPoints += 3;
    if (promo.categories.includes(unit.category)) {
      matchPoints += 3;
      reasons.push(`Category match: ${unit.category}`);
    } else {
      return { confidence: 'none', reasons: [], warnings: ['Category not eligible'] };
    }
  }

  // Model year match
  if (promo.eligibleModelYears?.length > 0) {
    maxPoints += 2;
    if (promo.eligibleModelYears.includes(unit.year)) {
      matchPoints += 2;
      reasons.push(`Model year ${unit.year} eligible`);
    } else {
      warnings.push(`Model year ${unit.year} not in eligible list: ${promo.eligibleModelYears.join(', ')}`);
    }
  }

  // New/Used match
  if (promo.newUsed && promo.newUsed !== 'both') {
    maxPoints += 1;
    const unitCondition = (unit.condition || 'New').toLowerCase();
    if ((promo.newUsed === 'new' && unitCondition === 'new') || (promo.newUsed === 'used' && unitCondition !== 'new')) {
      matchPoints += 1;
      reasons.push(`Condition match: ${unit.condition}`);
    } else {
      return { confidence: 'none', reasons: [], warnings: ['Condition not eligible'] };
    }
  }

  // Model match (fuzzy)
  if (promo.eligibleModels) {
    maxPoints += 2;
    const models = promo.eligibleModels.toLowerCase().split(/[,;\/]/).map((m) => m.trim()).filter(Boolean);
    const unitModel = (unit.model || '').toLowerCase();
    if (models.some((m) => unitModel.includes(m) || m.includes(unitModel))) {
      matchPoints += 2;
      reasons.push(`Model match: ${unit.model}`);
    } else {
      warnings.push(`Model "${unit.model}" not explicitly listed in eligible models`);
    }
  }

  // Determine confidence
  if (maxPoints === 0) return { confidence: matchPoints > 0 ? 'probable' : 'partial', reasons, warnings };
  const ratio = matchPoints / maxPoints;
  let confidence;
  if (ratio >= 0.9) confidence = 'exact';
  else if (ratio >= 0.6) confidence = 'probable';
  else if (ratio >= 0.3) confidence = 'partial';
  else if (warnings.length > 0) confidence = 'review';
  else confidence = 'none';

  return { confidence, reasons, warnings };
}

/**
 * Evaluate match between one unit and one pricing record.
 */
function evaluatePricingMatch(unit, pr) {
  const reasons = [];
  let matchPoints = 0;
  let maxPoints = 0;

  // Year match
  if (pr.year) {
    maxPoints += 3;
    if (unit.year === pr.year) { matchPoints += 3; reasons.push(`Year match: ${unit.year}`); }
  }

  // Make match
  if (pr.make) {
    maxPoints += 3;
    if ((unit.make || '').toLowerCase() === (pr.make || '').toLowerCase()) { matchPoints += 3; reasons.push(`Make match: ${unit.make}`); }
  }

  // Model match
  if (pr.model) {
    maxPoints += 3;
    const unitModel = (unit.model || '').toLowerCase();
    const prModel = (pr.model || '').toLowerCase();
    if (unitModel === prModel) { matchPoints += 3; reasons.push(`Model exact match`); }
    else if (unitModel.includes(prModel) || prModel.includes(unitModel)) { matchPoints += 2; reasons.push(`Model partial match`); }
  }

  if (maxPoints === 0) return { confidence: 'none', reasons: [] };
  const ratio = matchPoints / maxPoints;
  let confidence;
  if (ratio >= 0.9) confidence = 'exact';
  else if (ratio >= 0.6) confidence = 'probable';
  else if (ratio >= 0.3) confidence = 'partial';
  else confidence = 'none';

  return { confidence, reasons };
}

/**
 * Calculate opportunity score for a unit (0-100).
 * Transparent, explainable scoring.
 */
export function calcOpportunityScore(unit, promoMatches, pricingMatches) {
  let score = 50; // Base score
  const factors = [];

  // Promo APR support
  const bestAPR = promoMatches.find((m) => m.aprRate !== null && m.confidenceScore >= 0.5);
  if (bestAPR) {
    score += SCORING_WEIGHTS.hasPromoAPR;
    factors.push({ label: `Promo APR ${bestAPR.aprRate}%`, impact: '+' + SCORING_WEIGHTS.hasPromoAPR, color: '#16a34a' });
  }

  // Rebate support
  const bestRebate = promoMatches.find((m) => m.rebateAmount && m.confidenceScore >= 0.5);
  if (bestRebate) {
    score += SCORING_WEIGHTS.hasRebate;
    factors.push({ label: `$${bestRebate.rebateAmount} Rebate`, impact: '+' + SCORING_WEIGHTS.hasRebate, color: '#16a34a' });
  }

  // Customer cash
  const bestCash = promoMatches.find((m) => m.customerCash && m.confidenceScore >= 0.5);
  if (bestCash) {
    score += SCORING_WEIGHTS.hasCustomerCash;
    factors.push({ label: `$${bestCash.customerCash} Customer Cash`, impact: '+' + SCORING_WEIGHTS.hasCustomerCash, color: '#16a34a' });
  }

  // Pricing record
  if (pricingMatches.length > 0 && pricingMatches[0].confidenceScore >= 0.5) {
    score += SCORING_WEIGHTS.hasPricingRecord;
    factors.push({ label: 'Pricing record available', impact: '+' + SCORING_WEIGHTS.hasPricingRecord, color: '#2563eb' });
  }

  // Expiring promo urgency
  const expiringPromo = promoMatches.find((m) => m.daysUntilExpiry !== null && m.daysUntilExpiry <= 14 && m.confidenceScore >= 0.5);
  if (expiringPromo) {
    score += SCORING_WEIGHTS.promoExpiringDays;
    factors.push({ label: `Promo expires in ${expiringPromo.daysUntilExpiry}d`, impact: '+' + SCORING_WEIGHTS.promoExpiringDays, color: '#d97706' });
  }

  // Aged inventory bonus
  const days = unit.floorplanDays || calcFloorplanDays(unit.dateReceived);
  if (days >= 61) {
    score += SCORING_WEIGHTS.agedInventoryBonus;
    factors.push({ label: `Aged ${days} days`, impact: '+' + SCORING_WEIGHTS.agedInventoryBonus, color: '#dc2626' });
  }

  // Carryover year bonus
  const currentYear = new Date().getFullYear();
  if (unit.year < currentYear) {
    score += SCORING_WEIGHTS.carryoverYearBonus;
    factors.push({ label: `Carryover (${unit.year})`, impact: '+' + SCORING_WEIGHTS.carryoverYearBonus, color: '#d97706' });
  }

  // Penalties
  if (promoMatches.length === 0) {
    score += SCORING_WEIGHTS.noPromoSupport;
    factors.push({ label: 'No promo support', impact: String(SCORING_WEIGHTS.noPromoSupport), color: '#dc2626' });
  }

  const ambiguous = promoMatches.filter((m) => m.confidence === 'partial' || m.confidence === 'review');
  if (ambiguous.length > 0) {
    score += SCORING_WEIGHTS.ambiguousMatch;
    factors.push({ label: 'Ambiguous match', impact: String(SCORING_WEIGHTS.ambiguousMatch), color: '#d97706' });
  }

  if (!unit.make || !unit.model) {
    score += SCORING_WEIGHTS.missingData;
    factors.push({ label: 'Missing unit data', impact: String(SCORING_WEIGHTS.missingData), color: '#dc2626' });
  }

  return { score: Math.max(0, Math.min(100, score)), factors };
}

/**
 * Generate a quick payment estimate for a unit using best available promo.
 * Returns standard and promo payment for comparison.
 * LABELED AS ESTIMATES — not lender-exact.
 */
export function calcPaymentEstimates(unit, promoMatches, defaultAPR = 7.99, defaultTerm = 60) {
  const price = unit.internetPrice || unit.msrp || 0;
  if (price <= 0) return null;

  const standardPayment = calcMonthlyPayment(price, defaultAPR, defaultTerm);

  const bestAPR = promoMatches.find((m) => m.aprRate !== null && m.confidenceScore >= 0.5);
  const bestRebate = promoMatches.find((m) => m.rebateAmount && m.confidenceScore >= 0.5);

  const promoPrice = price - (bestRebate?.rebateAmount || 0);
  const promoAPR = bestAPR?.aprRate ?? defaultAPR;
  const promoTerm = bestAPR?.aprTerm || defaultTerm;
  const promoPayment = calcMonthlyPayment(Math.max(0, promoPrice), promoAPR, promoTerm);

  return {
    standardPayment,
    standardAPR: defaultAPR,
    standardTerm: defaultTerm,
    promoPayment,
    promoAPR,
    promoTerm,
    monthlySavings: Math.round((standardPayment - promoPayment) * 100) / 100,
    rebateApplied: bestRebate?.rebateAmount || 0,
    isEstimate: true, // Always flag as estimate
  };
}

/**
 * Run matching engine on entire inventory against all promos/pricing.
 * Returns enriched inventory items with match data + sorted by opportunity.
 */
export function runFullMatching(inventoryItems, promoRecords, pricingRecords) {
  return (inventoryItems || []).map((unit) => {
    const promoMatches = matchUnitToPromos(unit, promoRecords || []);
    const pricingMatches = matchUnitToPricing(unit, pricingRecords || []);
    const opportunity = calcOpportunityScore(unit, promoMatches, pricingMatches);
    const paymentEstimate = calcPaymentEstimates(unit, promoMatches);

    return {
      ...unit,
      _promoMatches: promoMatches,
      _pricingMatches: pricingMatches,
      _opportunityScore: opportunity.score,
      _opportunityFactors: opportunity.factors,
      _paymentEstimate: paymentEstimate,
      _bestPromoConfidence: promoMatches.length > 0 ? promoMatches[0].confidence : 'none',
      _hasPromoAPR: promoMatches.some((m) => m.aprRate !== null && m.confidenceScore >= 0.5),
      _hasRebate: promoMatches.some((m) => m.rebateAmount && m.confidenceScore >= 0.5),
      _expiringPromo: promoMatches.find((m) => m.daysUntilExpiry !== null && m.daysUntilExpiry <= 14),
      _needsReview: promoMatches.some((m) => m.confidence === 'review'),
    };
  }).sort((a, b) => b._opportunityScore - a._opportunityScore);
}
