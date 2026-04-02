/**
 * Promo & Pricing Parser
 * Attempts to extract structured records from Excel/CSV uploads.
 * Returns draft records for human review — never auto-publishes.
 */

/**
 * Parse an Excel file into draft promo or pricing records.
 * @param {ArrayBuffer} data - file content
 * @param {string} fileType - one of UPLOAD_TYPES ids
 * @param {object} meta - { brand, storeIds, effectiveStart, effectiveEnd }
 * @returns {Promise<{ records: Array, warnings: string[] }>}
 */
export async function parseExcelFile(data, fileType, meta = {}) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(data, { type: 'array' });
  const warnings = [];
  let records = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (rows.length === 0) {
      warnings.push(`Sheet "${sheetName}" is empty.`);
      continue;
    }

    if (fileType === 'price_list' || fileType === 'msrp_sheet' || fileType === 'carryover_pricing') {
      const parsed = parsePricingSheet(rows, meta, sheetName);
      records = records.concat(parsed.records);
      warnings.push(...parsed.warnings);
    } else {
      // Promo-type files
      const parsed = parsePromoSheet(rows, meta, sheetName);
      records = records.concat(parsed.records);
      warnings.push(...parsed.warnings);
    }
  }

  if (records.length === 0) {
    warnings.push('No records could be extracted. You may need to enter data manually.');
  }

  return { records, warnings };
}

/**
 * Parse rows as pricing records (year/make/model/MSRP).
 */
function parsePricingSheet(rows, meta, sheetName) {
  const records = [];
  const warnings = [];
  const headers = Object.keys(rows[0] || {}).map((h) => h.toLowerCase().trim());

  for (let i = 0; i < rows.length; i++) {
    const row = {};
    Object.entries(rows[i]).forEach(([k, v]) => { row[k.toLowerCase().trim()] = String(v).trim(); });

    const get = (...keys) => {
      for (const k of keys) { if (row[k] && row[k] !== '0' && row[k] !== '') return row[k]; }
      return '';
    };

    const model = get('model', 'model name', 'description', 'product', 'unit', 'name', 'model/description');
    const msrp = parseFloat(get('msrp', 'retail', 'price', 'retail price', 'list price', 'suggested retail', 'srp').replace(/[$,]/g, '')) || 0;

    if (!model && !msrp) continue;

    records.push({
      id: `pricing_${Date.now()}_${i}`,
      status: 'draft',
      sourceFileName: sheetName,
      year: parseInt(get('year', 'model year', 'yr')) || new Date().getFullYear(),
      make: get('make', 'brand', 'manufacturer', 'oem') || meta.brand || '',
      model,
      trim: get('trim', 'package', 'configuration', 'spec'),
      category: guessCategory(get('type', 'category', 'class', 'unit type') || model),
      msrp,
      freight: parseFloat(get('freight', 'destination', 'shipping').replace(/[$,]/g, '')) || 0,
      setup: parseFloat(get('setup', 'prep', 'assembly').replace(/[$,]/g, '')) || 0,
      destination: parseFloat(get('destination charge', 'dest').replace(/[$,]/g, '')) || 0,
      suggestedSalePrice: parseFloat(get('sale price', 'suggested sale', 'target price').replace(/[$,]/g, '')) || 0,
      storeIds: meta.storeIds || [],
      newUsed: 'new',
      notes: get('notes', 'comments', 'note'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  if (records.length === 0) {
    warnings.push(`Sheet "${sheetName}": Could not extract pricing records. Check column headers.`);
  } else {
    warnings.push(`Sheet "${sheetName}": Extracted ${records.length} pricing record(s) — please review before publishing.`);
  }

  return { records, warnings };
}

/**
 * Parse rows as promo records (programs, APR, rebates).
 */
function parsePromoSheet(rows, meta, sheetName) {
  const records = [];
  const warnings = [];

  for (let i = 0; i < rows.length; i++) {
    const row = {};
    Object.entries(rows[i]).forEach(([k, v]) => { row[k.toLowerCase().trim()] = String(v).trim(); });

    const get = (...keys) => {
      for (const k of keys) { if (row[k] && row[k] !== '' && row[k] !== '0') return row[k]; }
      return '';
    };

    const programName = get('program', 'program name', 'promo', 'promotion', 'offer', 'description', 'name');
    if (!programName) continue;

    const aprStr = get('apr', 'rate', 'interest rate', 'promo apr', 'promotional rate');
    const rebateStr = get('rebate', 'rebate amount', 'incentive', 'cash back', 'customer cash');
    const termStr = get('term', 'months', 'term months', 'duration');

    records.push({
      id: `promo_${Date.now()}_${i}`,
      status: 'draft',
      type: meta.fileType || 'monthly_promo',
      sourceFileName: sheetName,
      brand: get('brand', 'oem', 'manufacturer', 'make') || meta.brand || '',
      programName,
      programMonth: meta.effectiveStart ? new Date(meta.effectiveStart).toLocaleString('default', { month: 'long', year: 'numeric' }) : '',
      effectiveStart: meta.effectiveStart || '',
      effectiveEnd: meta.effectiveEnd || '',
      storeIds: meta.storeIds || [],
      categories: guessCategories(get('category', 'type', 'class', 'segment', 'unit type')),
      eligibleModelYears: parseModelYears(get('model year', 'years', 'eligible years', 'year')),
      eligibleModels: get('models', 'eligible models', 'applicable models'),
      newUsed: get('new/used', 'condition', 'new used') || 'new',
      aprRate: aprStr ? parseFloat(aprStr.replace(/[%]/g, '')) : null,
      aprTerm: termStr ? parseInt(termStr) : null,
      aprMinFinanced: parseFloat(get('min financed', 'minimum financed', 'min amount').replace(/[$,]/g, '')) || null,
      rebateAmount: rebateStr ? parseFloat(rebateStr.replace(/[$,]/g, '')) : null,
      customerCash: parseFloat(get('customer cash', 'cash offer').replace(/[$,]/g, '')) || null,
      specialFinancing: get('special', 'special financing', 'special offer'),
      stackable: get('stackable', 'combinable', 'stack').toLowerCase() === 'yes',
      disclaimer: get('disclaimer', 'fine print', 'terms'),
      notes: get('notes', 'comments'),
      createdBy: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedBy: '',
      publishedAt: '',
    });
  }

  if (records.length === 0) {
    warnings.push(`Sheet "${sheetName}": Could not extract promo records. Check column headers.`);
  } else {
    warnings.push(`Sheet "${sheetName}": Extracted ${records.length} promo record(s) — please review before publishing.`);
  }

  return { records, warnings };
}

// ── Helpers ──

function guessCategory(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('atv') || t.includes('quad')) return 'ATV';
  if (t.includes('sxs') || t.includes('side by side') || t.includes('ranger') || t.includes('rzr') || t.includes('general')) return 'SXS';
  if (t.includes('pwc') || t.includes('jet ski') || t.includes('waverunner')) return 'PWC';
  if (t.includes('boat') || t.includes('pontoon') || t.includes('center console') || t.includes('marine')) return 'BOAT';
  if (t.includes('trailer')) return 'TRAILER';
  if (t.includes('youth') || t.includes('kids')) return 'YOUTH';
  if (t.includes('engine') || t.includes('repower')) return 'ENGINE REPOWER';
  return '';
}

function guessCategories(text) {
  if (!text) return [];
  return text.split(/[,;\/]/).map((t) => guessCategory(t.trim())).filter(Boolean);
}

function parseModelYears(text) {
  if (!text) return [];
  const matches = String(text).match(/\d{4}/g);
  return matches ? [...new Set(matches.map(Number))] : [];
}
