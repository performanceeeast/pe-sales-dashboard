import React from 'react';
import { calcDealSummary } from '../../lib/fiMenuCalc';
import { styles, FM, FH, FB } from '../../components/SharedUI';

const { btn1: b1, btn2: b2 } = styles;

export default function MenuPresentation({ menu, packages, products, onBack, storeTheme }) {
  if (!menu) return null;

  // Build package columns for presentation (up to 3: Silver/Gold/Platinum or equivalent)
  const presentPackages = (packages || [])
    .filter((pkg) => pkg.products.length > 0)
    .sort((a, b) => (b.displayOrder || 0) - (a.displayOrder || 0)) // Highest first = most products
    .slice(0, 3)
    .reverse(); // Display left-to-right: Basic → Premium

  // Also add a "Cash / No Products" option
  const baseSummary = calcDealSummary(
    { salePrice: menu.salePrice || 0, accessories: menu.accessories || 0, freightPrep: menu.freightPrep || 0, docFee: menu.docFee || 0, downPayment: menu.downPayment || 0, tradeAllowance: menu.tradeAllowance || 0, tradePayoff: menu.tradePayoff || 0, apr: menu.apr || 0, term: menu.term || 60 },
    [], menu.taxRate || 0
  );

  // Calculate summary for each package
  const packageSummaries = presentPackages.map((pkg) => {
    const pkgProducts = pkg.products.map((pid) => {
      const p = products.find((x) => x.id === pid);
      if (!p) return null;
      return { productId: p.id, name: p.name, retailPrice: p.retailPrice, cost: p.cost, financeable: p.financeable, taxable: p.taxable, description: p.description };
    }).filter(Boolean);

    const summary = calcDealSummary(
      { salePrice: menu.salePrice || 0, accessories: menu.accessories || 0, freightPrep: menu.freightPrep || 0, docFee: menu.docFee || 0, downPayment: menu.downPayment || 0, tradeAllowance: menu.tradeAllowance || 0, tradePayoff: menu.tradePayoff || 0, apr: menu.apr || 0, term: menu.term || 60 },
      pkgProducts, menu.taxRate || 0
    );

    return { ...pkg, products: pkgProducts, summary };
  });

  function handlePrint() {
    const logo = storeTheme?.logo || '/logo.png';
    const brand = storeTheme?.brand_primary || '#b91c1c';
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) return;

    const cols = packageSummaries.map((pkg) => `
      <div style="flex:1;min-width:200px;border:1px solid #e2e8f0;border-radius:8px;padding:20px;${pkg.recommended ? `border-color:${brand};border-width:2px;` : ''}">
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:10px;color:${pkg.color || '#6b7280'};font-weight:700;letter-spacing:2px;text-transform:uppercase;">${pkg.name}</div>
          ${pkg.recommended ? '<div style="font-size:9px;color:#d97706;font-weight:700;margin-top:4px;">★ RECOMMENDED</div>' : ''}
          <div style="font-size:32px;font-weight:700;color:${brand};margin:12px 0;">$${pkg.summary.withProductsPayment.toFixed(2)}</div>
          <div style="font-size:11px;color:#64748b;">per month / ${menu.term} months</div>
        </div>
        <div style="border-top:1px solid #e2e8f0;padding-top:12px;">
          <div style="font-size:10px;color:#94a3b8;font-weight:600;letter-spacing:1px;margin-bottom:8px;">INCLUDED PROTECTIONS</div>
          ${pkg.products.map((p) => `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;"><span style="color:#16a34a;">✓</span> ${p.name}</div>`).join('')}
        </div>
        <div style="margin-top:12px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:10px;color:#64748b;">
          Amount Financed: $${pkg.summary.withProductsFinanced.toLocaleString()}<br/>
          Only +$${pkg.summary.paymentDifference.toFixed(2)}/mo over base
        </div>
      </div>
    `).join('');

    w.document.write(`<!DOCTYPE html><html><head><title>Finance Menu - ${menu.customer}</title>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
      </head><body style="font-family:Outfit,sans-serif;padding:30px;color:#1e293b;max-width:900px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid ${brand};">
        <div><img src="${logo}" style="height:40px;" onerror="this.style.display='none'"/></div>
        <div style="text-align:right;"><div style="font-family:Oswald;font-size:14px;font-weight:700;color:${brand};">FINANCE MENU</div><div style="font-size:11px;color:#94a3b8;">${menu.date}</div></div>
      </div>
      <div style="margin-bottom:20px;">
        <div style="font-family:Oswald;font-size:18px;font-weight:700;">${menu.customer}</div>
        <div style="font-size:11px;color:#64748b;">${menu.year || ''} ${menu.make || ''} ${menu.model || ''} ${menu.vin ? '| VIN: ' + menu.vin : ''}</div>
        <div style="font-size:11px;color:#64748b;">Sale Price: $${(menu.salePrice || 0).toLocaleString()} | Down: $${(menu.downPayment || 0).toLocaleString()} | ${menu.lender || 'TBD'} @ ${menu.apr || 0}%</div>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:20px;">
        <div style="flex:0 0 160px;border:1px solid #e2e8f0;border-radius:8px;padding:20px;text-align:center;background:#f8fafc;">
          <div style="font-size:10px;color:#94a3b8;font-weight:600;letter-spacing:2px;">CASH / BASE</div>
          <div style="font-size:28px;font-weight:700;color:#64748b;margin:12px 0;">$${baseSummary.basePayment.toFixed(2)}</div>
          <div style="font-size:11px;color:#94a3b8;">per month</div>
          <div style="margin-top:12px;font-size:10px;color:#94a3b8;">No additional protections</div>
        </div>
        ${cols}
      </div>
      <div style="font-size:9px;color:#94a3b8;margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;">
        ${menu.disclaimerText || 'All prices and payments are estimates. Final terms subject to lender approval.'}
      </div>
      <div style="margin-top:30px;display:flex;gap:40px;">
        <div style="flex:1;border-top:1px solid #1e293b;padding-top:4px;font-size:10px;color:#94a3b8;">Customer Signature</div>
        <div style="flex:1;border-top:1px solid #1e293b;padding-top:4px;font-size:10px;color:#94a3b8;">Date</div>
      </div>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{menu.customer}</div>
          <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>
            {menu.year} {menu.make} {menu.model} {menu.vin ? `| ${menu.vin}` : ''} | {menu.lender || 'TBD'} @ {menu.apr}% / {menu.term}mo
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onBack} style={b2}>BACK</button>
          <button onClick={handlePrint} style={b1}>PRINT</button>
        </div>
      </div>

      {/* Package Columns */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {/* Base / Cash option */}
        <div style={{
          flex: '0 0 180px', background: 'var(--bg-tertiary)', borderRadius: 10,
          border: '1px solid var(--border-primary)', padding: 20, textAlign: 'center',
        }}>
          <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, fontWeight: 600 }}>CASH / BASE</div>
          <div style={{ fontFamily: FH, fontSize: 32, fontWeight: 700, color: 'var(--text-secondary)', margin: '12px 0', lineHeight: 1 }}>
            ${baseSummary.basePayment.toFixed(2)}
          </div>
          <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>per month</div>
          <div style={{ fontFamily: FM, fontSize: 10, color: 'var(--text-muted)', marginTop: 16 }}>No additional protections</div>
        </div>

        {/* Package columns */}
        {packageSummaries.map((pkg) => (
          <div key={pkg.id} style={{
            flex: 1, minWidth: 220, borderRadius: 10, padding: 20, textAlign: 'center',
            border: pkg.recommended ? `2px solid var(--brand-red)` : '1px solid var(--border-primary)',
            background: pkg.recommended ? 'var(--brand-red-soft)' : 'var(--card-bg)',
            position: 'relative',
          }}>
            {pkg.recommended && (
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                fontFamily: FM, fontSize: 8, fontWeight: 700, color: 'var(--text-inverse)',
                background: 'var(--brand-red)', padding: '2px 10px', borderRadius: 3, letterSpacing: 1,
              }}>RECOMMENDED</div>
            )}
            <div style={{ fontFamily: FM, fontSize: 10, color: pkg.color || 'var(--text-muted)', letterSpacing: 2, fontWeight: 700 }}>{pkg.name.toUpperCase()}</div>
            <div style={{ fontFamily: FH, fontSize: 36, fontWeight: 700, color: 'var(--brand-red)', margin: '12px 0', lineHeight: 1 }}>
              ${pkg.summary.withProductsPayment.toFixed(2)}
            </div>
            <div style={{ fontFamily: FM, fontSize: 11, color: 'var(--text-muted)' }}>per month / {menu.term} months</div>

            <div style={{ borderTop: '1px solid var(--border-primary)', marginTop: 16, paddingTop: 12, textAlign: 'left' }}>
              <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 1, marginBottom: 8 }}>INCLUDED PROTECTIONS</div>
              {pkg.products.map((p) => (
                <div key={p.productId} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '4px 0' }}>
                  <span style={{ color: '#16a34a', fontSize: 12, flexShrink: 0 }}>{'\u2713'}</span>
                  <div>
                    <div style={{ fontFamily: FM, fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)' }}>{p.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--border-secondary)', fontFamily: FM, fontSize: 10, color: 'var(--text-muted)' }}>
              Only +${pkg.summary.paymentDifference.toFixed(2)}/mo over base
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{ fontFamily: FM, fontSize: 9, color: 'var(--text-muted)', padding: '12px 0', borderTop: '1px solid var(--border-primary)' }}>
        {menu.disclaimerText || 'All prices and payments are estimates. Final terms subject to lender approval.'}
      </div>
    </div>
  );
}
