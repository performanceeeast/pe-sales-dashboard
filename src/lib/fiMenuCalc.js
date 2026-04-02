/**
 * F&I Menu Payment Calculator
 * Pure functions — no side effects, no imports.
 */

/**
 * Calculate amount financed from deal info and selected products.
 */
export function calcAmountFinanced({
  salePrice = 0, accessories = 0, freightPrep = 0, docFee = 0,
  taxRate = 0, downPayment = 0, tradeAllowance = 0, tradePayoff = 0,
  financeableProductsTotal = 0,
}) {
  const subtotal = salePrice + accessories + freightPrep + docFee + financeableProductsTotal;
  const taxable = subtotal; // Simplified — adjust per state tax rules if needed
  const taxes = taxable * (taxRate / 100);
  const tradeNet = tradeAllowance - tradePayoff;
  const amountFinanced = subtotal + taxes - downPayment - tradeNet;
  return Math.max(0, Math.round(amountFinanced * 100) / 100);
}

/**
 * Calculate monthly payment using standard amortization formula.
 * Handles 0% APR edge case (simple division).
 */
export function calcMonthlyPayment(amountFinanced, apr, termMonths) {
  if (!amountFinanced || amountFinanced <= 0 || !termMonths || termMonths <= 0) return 0;
  if (!apr || apr <= 0) return Math.round((amountFinanced / termMonths) * 100) / 100;

  const monthlyRate = apr / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  const payment = amountFinanced * (monthlyRate * factor) / (factor - 1);
  return Math.round(payment * 100) / 100;
}

/**
 * Calculate total of all payments.
 */
export function calcTotalOfPayments(monthlyPayment, termMonths) {
  return Math.round((monthlyPayment * termMonths) * 100) / 100;
}

/**
 * Calculate total finance charge.
 */
export function calcFinanceCharge(totalOfPayments, amountFinanced) {
  return Math.round((totalOfPayments - amountFinanced) * 100) / 100;
}

/**
 * Composite: calculate full deal summary with and without products.
 * Returns both base payment (no F&I products) and with-products payment.
 */
export function calcDealSummary(dealInfo, selectedProducts = [], taxRate = 0) {
  const financeableProducts = selectedProducts.filter((p) => p.financeable !== false);
  const financeableTotal = financeableProducts.reduce((s, p) => s + (p.retailPrice || 0), 0);

  const baseFinanced = calcAmountFinanced({ ...dealInfo, taxRate, financeableProductsTotal: 0 });
  const withProductsFinanced = calcAmountFinanced({ ...dealInfo, taxRate, financeableProductsTotal: financeableTotal });

  const basePayment = calcMonthlyPayment(baseFinanced, dealInfo.apr, dealInfo.term);
  const withProductsPayment = calcMonthlyPayment(withProductsFinanced, dealInfo.apr, dealInfo.term);

  const totalOfPayments = calcTotalOfPayments(withProductsPayment, dealInfo.term);
  const financeCharge = calcFinanceCharge(totalOfPayments, withProductsFinanced);

  const productsCost = selectedProducts.reduce((s, p) => s + (p.cost || 0), 0);
  const productsRetail = selectedProducts.reduce((s, p) => s + (p.retailPrice || 0), 0);
  const productsGross = productsRetail - productsCost;

  return {
    baseFinanced,
    withProductsFinanced,
    basePayment,
    withProductsPayment,
    paymentDifference: Math.round((withProductsPayment - basePayment) * 100) / 100,
    totalOfPayments,
    financeCharge,
    productsRetail,
    productsCost,
    productsGross,
  };
}
