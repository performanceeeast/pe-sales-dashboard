import React, { useState, useEffect } from 'react';
import { getProductsForStore, getPackagesForStore, DEFAULT_FI_PRODUCTS, DEFAULT_FI_PACKAGES } from '../../lib/fiMenuConstants';
import { canEditFiMenuSettings } from '../../lib/auth';
import { styles, FM, FH } from '../../components/SharedUI';
import MenuList from './MenuList';
import MenuBuilder from './MenuBuilder';
import MenuPresentation from './MenuPresentation';
import MenuSettings from './MenuSettings';

const { btn1: b1, btn2: b2 } = styles;

export default function FIMenuTab({
  month, year, deals, fiDeals, currentUser, act,
  storeConfig, backEndProducts, storeTheme,
  fiMenus, saveFiMenus, fiMenuConfig, saveFiMenuConfig,
}) {
  const [subView, setSubView] = useState('list'); // list | builder | presentation | settings
  const [editingMenu, setEditingMenu] = useState(null);
  const [presentingMenu, setPresentingMenu] = useState(null);

  // Seed config on first load if empty
  useEffect(() => {
    if (!fiMenuConfig || (!fiMenuConfig.products && !fiMenuConfig.packages)) {
      const seedProducts = getProductsForStore(storeConfig, DEFAULT_FI_PRODUCTS);
      const seedPackages = getPackagesForStore(storeConfig, seedProducts, DEFAULT_FI_PACKAGES);
      saveFiMenuConfig({
        ...fiMenuConfig,
        products: seedProducts,
        packages: seedPackages,
      });
    }
  }, []);

  const products = fiMenuConfig?.products || getProductsForStore(storeConfig, DEFAULT_FI_PRODUCTS);
  const packages = fiMenuConfig?.packages || getPackagesForStore(storeConfig, products, DEFAULT_FI_PACKAGES);
  const canSettings = canEditFiMenuSettings(currentUser);

  // CRUD
  function addMenu(menu) {
    const menus = [...(fiMenus || []), menu];
    saveFiMenus(menus);
    setEditingMenu(null);
    setSubView('list');
  }

  function updateMenu(id, updated) {
    const menus = (fiMenus || []).map((m) => m.id === id ? updated : m);
    saveFiMenus(menus);
    setEditingMenu(null);
  }

  function deleteMenu(id) {
    saveFiMenus((fiMenus || []).filter((m) => m.id !== id));
  }

  function handleSaveMenu(menu) {
    if ((fiMenus || []).find((m) => m.id === menu.id)) {
      updateMenu(menu.id, menu);
    } else {
      addMenu(menu);
    }
  }

  // Navigation helpers
  function openBuilder(menu = null) {
    setEditingMenu(menu);
    setSubView('builder');
  }

  function openPresentation(menu) {
    setPresentingMenu(menu);
    setSubView('presentation');
  }

  function backToList() {
    setEditingMenu(null);
    setPresentingMenu(null);
    setSubView('list');
  }

  return (
    <div>
      {/* Sub-nav bar */}
      {subView !== 'presentation' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 2, background: 'var(--tab-bg)', borderRadius: 6, padding: 2 }}>
            {[
              { id: 'list', label: 'MENU LIST' },
              ...(canSettings ? [{ id: 'settings', label: 'SETTINGS' }] : []),
            ].map((v) => (
              <button key={v.id} onClick={() => { setSubView(v.id); setEditingMenu(null); }} style={{
                padding: '6px 12px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontFamily: FH, fontSize: 9, fontWeight: 600, letterSpacing: 0.5,
                background: subView === v.id ? 'var(--brand-red)' : 'transparent',
                color: subView === v.id ? 'var(--text-inverse)' : 'var(--text-muted)',
                transition: 'all .15s',
              }}>{v.label}</button>
            ))}
          </div>
          {subView === 'list' && (
            <button onClick={() => openBuilder()} style={b1}>+ NEW MENU</button>
          )}
          {subView === 'builder' && (
            <button onClick={backToList} style={b2}>BACK TO LIST</button>
          )}
        </div>
      )}

      {/* Sub-view content */}
      {subView === 'list' && (
        <MenuList
          fiMenus={fiMenus || []}
          onEdit={openBuilder}
          onPresent={openPresentation}
          onDelete={deleteMenu}
          act={act}
        />
      )}

      {subView === 'builder' && (
        <MenuBuilder
          menu={editingMenu}
          onSave={handleSaveMenu}
          onCancel={backToList}
          onPresent={() => { if (editingMenu) openPresentation(editingMenu); }}
          products={products}
          packages={packages}
          act={act}
          currentUser={currentUser}
          storeConfig={storeConfig}
          fiMenuConfig={fiMenuConfig}
        />
      )}

      {subView === 'presentation' && presentingMenu && (
        <MenuPresentation
          menu={presentingMenu}
          packages={packages}
          products={products}
          onBack={backToList}
          storeTheme={storeTheme}
        />
      )}

      {subView === 'settings' && canSettings && (
        <MenuSettings
          fiMenuConfig={fiMenuConfig}
          saveFiMenuConfig={saveFiMenuConfig}
          products={products}
          packages={packages}
        />
      )}
    </div>
  );
}
