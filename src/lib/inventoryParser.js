/**
 * Inventory Parser — Converts DMS exports (Excel/CSV) into normalized inventory records.
 * Smart column detection using COLUMN_MAPPINGS from inventoryConstants.
 * Returns draft records for human review — never auto-publishes.
 */
import { COLUMN_MAPPINGS, calcFloorplanDays } from './inventoryConstants';

/**
 * Parse an Excel/CSV file into draft inventory records.
 * @param {ArrayBuffer} data - file content
 * @param {object} meta - { storeId, fileName }
 * @returns {Promise<{ records: Array, warnings: string[], columnMap: object }>}
 */
export async function parseInventoryFile(data, meta = {}) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(data, { type: 'array' });
  const warnings = [];
  let records = [];
  let columnMap = {};

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (rows.length === 0) {
      warnings.push(`Sheet "${sheetName}" is empty.`);
      continue;
    }

    // Detect column mapping
    const headers = Object.keys(rows[0]).map((h) => h.toLowerCase().trim());
    columnMap = detectColumnMapping(headers);

    const unmapped = headers.filter((h) => !Object.values(columnMap).includes(h));
    if (unmapped.length > 0) {
      warnings.push(`Unmapped columns: ${unmapped.join(', ')}`);
    }

    // Parse rows
    for (let i = 0; i < rows.length; i++) {
      const row = {};
      Object.entries(rows[i]).forEach(([k, v]) => { row[k.toLowerCase().trim()] = String(v).trim(); });

      const item = extractInventoryItem(row, columnMap, meta, i);
      if (item) records.push(item);
    }

    warnings.push(`Sheet "${sheetName}": Extracted ${records.length} unit(s) — please review before publishing.`);
    break; // Use first sheet only
  }

  if (records.length === 0) {
    warnings.push('No inventory records could be extracted. Check column headers match your DMS export format.');
  }

  return { records, warnings, columnMap };
}

/**
 * Detect which of our fields each column header maps to.
 */
function detectColumnMapping(headers) {
  const map = {};

  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    for (const header of headers) {
      const normalized = header.replace(/[^a-z0-9 ]/g, '').trim();
      if (aliases.some((a) => normalized === a || normalized.includes(a))) {
        map[field] = header;
        break;
      }
    }
  }

  return map;
}

/**
 * Extract a single inventory item from a row using the detected column map.
 */
function extractInventoryItem(row, columnMap, meta, index) {
  const get = (field) => {
    const col = columnMap[field];
    return col ? (row[col] || '').trim() : '';
  };

  const stock = get('stock');
  const vin = get('vin');
  const model = get('model');
  const make = get('make');

  // Skip completely empty rows
  if (!stock && !vin && !model && !make) return null;

  const msrpStr = get('msrp').replace(/[$,]/g, '');
  const costStr = get('invoiceCost').replace(/[$,]/g, '');
  const priceStr = get('internetPrice').replace(/[$,]/g, '');
  const yearStr = get('year');
  const dateReceived = parseDate(get('dateReceived'));

  const item = {
    id: `inv_${Date.now()}_${index}`,
    importId: null,
    status: normalizeStatus(get('status')),
    stock,
    vin,
    year: parseInt(yearStr) || new Date().getFullYear(),
    make: make || meta.defaultMake || '',
    model,
    trim: get('trim'),
    color: get('color'),
    category: guessCategory(get('category') || model || make),
    condition: normalizeCondition(get('condition')),
    msrp: parseFloat(msrpStr) || 0,
    invoiceCost: parseFloat(costStr) || 0,
    internetPrice: parseFloat(priceStr) || 0,
    dateReceived,
    dateSold: parseDate(get('dateSold')),
    storeId: meta.storeId || '',
    location: get('location') || meta.location || '',
    floorplanDays: parseInt(get('floorplanDays')) || calcFloorplanDays(dateReceived),
    notes: get('notes'),
    activePromos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceFileName: meta.fileName || '',
  };

  return item;
}

// ── Helpers ──

function guessCategory(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('atv') || t.includes('quad') || t.includes('fourtrax') || t.includes('sportsman') || t.includes('grizzly')) return 'ATV';
  if (t.includes('sxs') || t.includes('side by side') || t.includes('ranger') || t.includes('rzr') || t.includes('general') || t.includes('maverick') || t.includes('teryx') || t.includes('pioneer') || t.includes('mule')) return 'SXS';
  if (t.includes('pwc') || t.includes('jet ski') || t.includes('waverunner') || t.includes('sea-doo') || t.includes('spark')) return 'PWC';
  if (t.includes('boat') || t.includes('pontoon') || t.includes('center console') || t.includes('deck') || t.includes('fish') || t.includes('robalo') || t.includes('sportsman boats') || t.includes('key west') || t.includes('tidewater')) return 'BOAT';
  if (t.includes('trailer') || t.includes('magic tilt') || t.includes('load rite') || t.includes('ez loader')) return 'TRAILER';
  if (t.includes('youth') || t.includes('50cc') || t.includes('90cc') || t.includes('kids') || t.includes('outlaw 70')) return 'YOUTH';
  if (t.includes('engine') || t.includes('repower') || t.includes('outboard') || t.includes('mercury') || t.includes('evinrude')) return 'ENGINE REPOWER';
  return '';
}

function normalizeStatus(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('sold') || s === 's') return 'sold';
  if (s.includes('order') || s.includes('ordered')) return 'on_order';
  if (s.includes('hold')) return 'hold';
  if (s.includes('trade')) return 'trade_in';
  if (s.includes('pending')) return 'pending_delivery';
  return 'in_stock';
}

function normalizeCondition(condition) {
  const c = (condition || '').toLowerCase();
  if (c.includes('used') || c === 'u') return 'Used';
  if (c.includes('demo')) return 'Demo';
  if (c.includes('consign')) return 'Consignment';
  return 'New';
}

function parseDate(str) {
  if (!str) return '';
  // Handle various date formats
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  // Try MM/DD/YYYY
  const parts = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (parts) {
    const yr = parts[3].length === 2 ? '20' + parts[3] : parts[3];
    return `${yr}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  return '';
}
