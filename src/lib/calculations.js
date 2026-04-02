import { UNIT_TYPES, BACK_END_PRODUCTS } from './constants';

/**
 * Get the PG&A flat amount for a given dollar value
 */
export function getPgaFlat(pgaAmount, pgaTiers) {
  if (!pgaAmount || pgaAmount <= 0) return 0;
  const tier = pgaTiers.find((t) => pgaAmount >= t.min && pgaAmount <= t.max);
  return tier ? tier.amount : 0;
}

/**
 * Get back-end spiff for a set of products sold
 */
export function getBeSpiff(products, beSpiffs) {
  if (!products || products.length === 0) return 0;
  const hasAll = BACK_END_PRODUCTS.every((p) => products.includes(p));
  if (hasAll) {
    const allBonus = beSpiffs.find((s) => s.product === 'ALL OF THE ABOVE');
    if (allBonus) return allBonus.amount;
  }
  return products.reduce((sum, p) => {
    const s = beSpiffs.find((x) => x.product === p);
    return sum + (s ? s.amount : 0);
  }, 0);
}

/**
 * Calculate unit counts for a salesperson
 */
export function getSpUnits(deals, spId) {
  const counts = { total: 0 };
  UNIT_TYPES.forEach((u) => { counts[u] = 0; });
  deals
    .filter((d) => d.salesperson === spId)
    .forEach((d) => {
      UNIT_TYPES.forEach((u) => {
        counts[u] += d.units?.[u] || 0;
      });
    });
  counts.total = UNIT_TYPES.reduce((s, u) => s + counts[u], 0);
  return counts;
}

/**
 * Full spiff breakdown for a salesperson
 */
export function getRepSpiffs(deals, spId, pgaTiers, beSpiffs, hitList) {
  const repDeals = deals.filter((d) => d.salesperson === spId);
  let totalPga = 0;
  let totalBe = 0;
  let totalHit = 0;

  const detailed = repDeals.map((d) => {
    const unitCount = UNIT_TYPES.reduce((s, u) => s + (d.units?.[u] || 0), 0);
    const pgaSpiff = getPgaFlat(d.pgaAmount || 0, pgaTiers) * unitCount;
    const beSpiff = getBeSpiff(d.backEndProducts || [], beSpiffs) * unitCount;
    const hitItem = hitList.find(
      (h) => h.soldBy === spId && h.dealNumber === d.dealNumber
    );
    const hitSpiff = hitItem ? hitItem.spiff : 0;

    totalPga += pgaSpiff;
    totalBe += beSpiff;
    totalHit += hitSpiff;

    return { ...d, pgaSpiff, beSpiff, hitSpiff, unitCount };
  });

  return {
    deals: detailed,
    totalPga,
    totalBe,
    totalHit,
    totalSpiffs: totalPga + totalBe + totalHit,
  };
}
