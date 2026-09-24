import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

type Props = {
  packages: any[]; setPackages: React.Dispatch<React.SetStateAction<any[]>>;
  categories: any; setCategories: React.Dispatch<React.SetStateAction<any>>;
  liveMenu: any; setLiveMenu: React.Dispatch<React.SetStateAction<any>>;
  extras: any[]; setExtras: React.Dispatch<React.SetStateAction<any[]>>;
  standardExtraCharges?: any[]; setStandardExtraCharges?: React.Dispatch<React.SetStateAction<any[]>>;
  tableService: any[]; setTableService: React.Dispatch<React.SetStateAction<any[]>>;
  kidsPricing: any[]; setKidsPricing: React.Dispatch<React.SetStateAction<any[]>>;
  dryHire: any[]; setDryHire: React.Dispatch<React.SetStateAction<any[]>>;
  tabTitles?: { packages?: string; menu?: string; live?: string };
  setTabTitles?: React.Dispatch<React.SetStateAction<{ packages: string; menu: string; live: string }>>;
  save: () => void;
  isSaving: boolean;
};

export default function MenusTabUI({
  packages, setPackages, categories, setCategories, liveMenu, setLiveMenu,
  extras, setExtras, standardExtraCharges, setStandardExtraCharges, tableService, setTableService, kidsPricing, setKidsPricing,
  dryHire, setDryHire, tabTitles, setTabTitles, save, isSaving
}: Props) {
  type Tab = 'packages' | 'categories' | 'live' | 'extras' | 'venue';
  const [activeTab, setActiveTab] = useState<Tab>('packages');

  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');
  const [newStdName, setNewStdName] = useState('');
  const [newStdPrice, setNewStdPrice] = useState('');

  const [newCategoryItem, setNewCategoryItem] = useState<{ [key: string]: string }>({});
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ index: number; name: string } | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-900">Menus & Packages Management</h2>
          <p className="text-xs text-gray-500">Edit menu tab names, packages, dishes, and pricing. Save to sync directly with the live website.</p>
        </div>
        <button onClick={save} disabled={isSaving} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-white shadow-md transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #ED1C24, #F5A623)' }}>
          <Icon name="CloudArrowUpIcon" size={16} />
          {isSaving ? 'Saving...' : 'Save Changes to Website'}
        </button>
      </div>

      {/* ─── PUBLIC HOMEPAGE MENU TABS CONFIGURATION (MADRAS FLAVOURS MATCH) ─── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>🏷️ Website Menu Navigation Tabs (Public Homepage)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Customize the titles of the 3 menu navigation buttons shown on the public homepage. Matches the Madras Flavours clone.
            </p>
          </div>
          {setTabTitles && (
            <button
              type="button"
              onClick={() => {
                setTabTitles({
                  packages: '🎁 Packages',
                  menu: '🍛 Menu Items',
                  live: '🍳 Live Dosa Menu',
                });
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Reset to Madras Flavours Names
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Tab 1 Name (Default: 🎁 Packages)</label>
            <input
              type="text"
              value={tabTitles?.packages ?? '🎁 Packages'}
              placeholder="🎁 Packages"
              onChange={e => setTabTitles && setTabTitles(prev => ({ ...prev, packages: e.target.value }))}
              className="w-full text-xs font-bold border border-gray-200 rounded-xl px-3.5 py-2 text-gray-900 bg-white focus:outline-none focus:border-[#ED1C24] shadow-2xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Tab 2 Name (Default: 🍛 Menu Items)</label>
            <input
              type="text"
              value={tabTitles?.menu ?? '🍛 Menu Items'}
              placeholder="🍛 Menu Items"
              onChange={e => setTabTitles && setTabTitles(prev => ({ ...prev, menu: e.target.value }))}
              className="w-full text-xs font-bold border border-gray-200 rounded-xl px-3.5 py-2 text-gray-900 bg-white focus:outline-none focus:border-[#ED1C24] shadow-2xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Tab 3 Name (Default: 🍳 Live Dosa Menu)</label>
            <input
              type="text"
              value={tabTitles?.live ?? '🍳 Live Dosa Menu'}
              placeholder="🍳 Live Dosa Menu"
              onChange={e => setTabTitles && setTabTitles(prev => ({ ...prev, live: e.target.value }))}
              className="w-full text-xs font-bold border border-gray-200 rounded-xl px-3.5 py-2 text-gray-900 bg-white focus:outline-none focus:border-[#ED1C24] shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: 'packages', label: '🎁 Packages' },
          { id: 'categories', label: '🍛 Menu Categories' },
          { id: 'live', label: '🎪 Live Dosa Party' },
          { id: 'extras', label: '✨ Extras' },
          { id: 'venue', label: '🏢 Venue & Services' }
        ] as { id: Tab; label: string }[]).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.id ? 'text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-400'}`}
            style={activeTab === tab.id ? { background: 'linear-gradient(135deg, #ED1C24, #F5A623)' } : {}}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>🎁 Active Packages ({packages.length})</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Add, edit, rearrange or remove packages. Changes immediately sync to the website and direct booking forms upon saving.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextNum = packages.length + 1;
                const newPkg = {
                  id: `package_${Date.now()}`,
                  name: `Package ${nextNum}`,
                  pricePerPerson: 18,
                  minGuests: 30,
                  guestLabel: '(Minimum 30 Pax)',
                  tag: 'Additional 20% VAT Tax',
                  items: [
                    '2 Starters',
                    '2 Veg Mains',
                    '1 Paneer Mains',
                    '1 Rice Or Noodles',
                    '1 Dessert',
                    '1 Bread'
                  ],
                  complimentary: 'Accompaniments like Papad, Pickle, Salad & Raitha will be Complimentary.',
                  color: '#ED1C24',
                };
                setPackages(prev => [...prev, newPkg]);
              }}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl text-white shadow-sm hover:shadow-md transition-all cursor-pointer"
              style={{ background: '#ED1C24' }}
            >
              <Icon name="PlusCircleIcon" size={16} />
              <span>Add New Package</span>
            </button>
          </div>

          {packages.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                <Icon name="SparklesIcon" size={24} />
              </div>
              <p className="text-sm font-medium text-gray-700">No packages configured.</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Add your first package to display it on the website.</p>
              <button
                type="button"
                onClick={() => {
                  setPackages([{
                    id: `package_${Date.now()}`,
                    name: 'Standard Package',
                    pricePerPerson: 15,
                    minGuests: 30,
                    guestLabel: '(Minimum 30 Pax)',
                    tag: 'Additional 20% VAT Tax',
                    items: ['2 Starters', '1 Veg Mains', '1 Paneer Mains', '1 Rice Or Noodles', '1 Dessert', '1 Bread'],
                    complimentary: 'Accompaniments like Papad, Pickle, Salad & Raitha will be Complimentary.',
                    color: '#ED1C24',
                  }]);
                }}
                className="text-xs font-bold px-4 py-2 rounded-xl text-white cursor-pointer"
                style={{ background: '#ED1C24' }}
              >
                + Add First Package
              </button>
            </div>
          )}

          {packages.map((pkg, i) => (
            <div key={pkg.id || i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-xs hover:border-gray-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    #{i + 1}
                  </span>
                  <input
                    type="text"
                    value={pkg.name || ''}
                    placeholder="Package Name (e.g. Gold Package)"
                    onChange={e => setPackages(p => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                    className="text-base font-bold border border-gray-200 rounded-lg px-3 py-1.5 focus:border-[#ED1C24] focus:outline-none flex-1 text-gray-900 bg-white shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-gray-500">£</span>
                    <input
                      type="number"
                      value={pkg.pricePerPerson ?? ''}
                      onChange={e => setPackages(p => p.map((x, idx) => idx === i ? { ...x, pricePerPerson: Number(e.target.value) } : x))}
                      className="w-20 text-right border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-[#ED1C24] focus:outline-none font-bold text-gray-900 bg-white shadow-2xs text-sm"
                    />
                    <span className="text-xs text-gray-500 font-medium">/pp</span>
                  </div>

                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => {
                      if (i === 0) return;
                      setPackages(p => {
                        const next = [...p];
                        const temp = next[i - 1];
                        next[i - 1] = next[i];
                        next[i] = temp;
                        return next;
                      });
                    }}
                    disabled={i === 0}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Package Up"
                  >
                    <Icon name="ChevronUpIcon" size={16} />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => {
                      if (i === packages.length - 1) return;
                      setPackages(p => {
                        const next = [...p];
                        const temp = next[i + 1];
                        next[i + 1] = next[i];
                        next[i] = temp;
                        return next;
                      });
                    }}
                    disabled={i === packages.length - 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Package Down"
                  >
                    <Icon name="ChevronDownIcon" size={16} />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmTarget({
                        index: i,
                        name: pkg.name || `Package #${i + 1}`,
                      });
                    }}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                    title="Delete Package"
                  >
                    <Icon name="TrashIcon" size={15} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-gray-500 font-medium block mb-1">Tag (e.g. Additional 20% VAT Tax, Best Value)</label>
                  <input
                    type="text"
                    value={pkg.tag || ''}
                    placeholder="e.g. Additional 20% VAT Tax"
                    onChange={e => setPackages(p => p.map((x, idx) => idx === i ? { ...x, tag: e.target.value } : x))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#ED1C24] text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="text-gray-500 font-medium block mb-1">Guest Label (e.g. Minimum 30 Pax)</label>
                  <input
                    type="text"
                    value={pkg.guestLabel || ''}
                    placeholder="e.g. (Minimum 30 Pax)"
                    onChange={e => setPackages(p => p.map((x, idx) => idx === i ? { ...x, guestLabel: e.target.value } : x))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#ED1C24] text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">
                  Courses & Items Included (Enter one course / item per line)
                </label>
                <textarea
                  rows={5}
                  placeholder="2 Starters&#10;1 Veg Mains&#10;1 Paneer Mains&#10;1 Rice Or Noodles&#10;1 Dessert&#10;1 Bread"
                  value={Array.isArray(pkg.items) ? pkg.items.join('\n') : (typeof pkg.items === 'string' ? pkg.items : '')}
                  onChange={e => {
                    const lines = e.target.value.split('\n');
                    setPackages(p => p.map((x, idx) => idx === i ? { ...x, items: lines } : x));
                  }}
                  className="w-full text-xs font-mono border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-[#ED1C24] text-gray-900 bg-white shadow-2xs leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Complimentary Note (Optional)</label>
                <input
                  type="text"
                  value={pkg.complimentary || ''}
                  placeholder="e.g. Accompaniments like Papad, Pickle, Salad & Raitha will be Complimentary."
                  onChange={e => setPackages(p => p.map((x, idx) => idx === i ? { ...x, complimentary: e.target.value } : x))}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#ED1C24] text-gray-900 bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(categories).map(([catKey, items]) => (
            <div key={catKey} className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 capitalize">{catKey.replace(/([A-Z])/g, ' $1').trim()}</h3>
              <div className="space-y-2 mb-3 max-h-60 overflow-y-auto pr-2">
                {(items as string[]).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={item} onChange={e => setCategories((prev: any) => ({ ...prev, [catKey]: prev[catKey].map((x: string, idx: number) => idx === i ? e.target.value : x) }))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                    <button onClick={() => setCategories((prev: any) => ({ ...prev, [catKey]: prev[catKey].filter((_: any, idx: number) => idx !== i) }))} className="p-2 text-gray-400 hover:text-red-500">
                      <Icon name="TrashIcon" size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Add new..." value={newCategoryItem[catKey] || ''} onChange={e => setNewCategoryItem({ ...newCategoryItem, [catKey]: e.target.value })} className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none bg-gray-50" />
                <button onClick={() => {
                  if (newCategoryItem[catKey]?.trim()) {
                    setCategories((prev: any) => ({ ...prev, [catKey]: [...prev[catKey], newCategoryItem[catKey].trim()] }));
                    setNewCategoryItem({ ...newCategoryItem, [catKey]: '' });
                  }
                }} className="text-white text-sm font-semibold px-3 py-2 rounded-lg bg-amber-500">
                  <Icon name="PlusIcon" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'live' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Title</h3>
            <input type="text" value={liveMenu.title} onChange={e => setLiveMenu((p: any) => ({ ...p, title: e.target.value }))} className="w-full border border-gray-200 rounded p-2 text-sm" />
            
            <h3 className="font-semibold text-gray-900 mb-2 mt-4">Pricing Rules (one per line)</h3>
            <textarea rows={4} value={(liveMenu.pricing || []).join('\n')} onChange={e => setLiveMenu((p: any) => ({ ...p, pricing: e.target.value.split('\n') }))} className="w-full border border-gray-200 rounded p-2 text-sm" />
            
            <h3 className="font-semibold text-gray-900 mb-2 mt-4">Items Included (one per line)</h3>
            <textarea rows={8} value={(liveMenu.items || []).join('\n')} onChange={e => setLiveMenu((p: any) => ({ ...p, items: e.target.value.split('\n') }))} className="w-full border border-gray-200 rounded p-2 text-sm" />
          </div>
        </div>
      )}

      {activeTab === 'extras' && (
        <>
        <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl">
          <h3 className="font-semibold text-gray-900 mb-4">Extras & Upgrades</h3>
          <div className="space-y-2 mb-4">
            {extras.map((extra, i) => (
              <div key={i} className="flex items-center gap-3">
                <input type="text" value={extra.name} onChange={e => setExtras(p => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <span className="text-gray-500">£</span>
                <input type="number" value={extra.price} onChange={e => setExtras(p => p.map((x, idx) => idx === i ? { ...x, price: Number(e.target.value) } : x))} className="w-24 text-right border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <button onClick={() => setExtras(p => p.filter((_, idx) => idx !== i))} className="p-2 text-gray-400 hover:text-red-500">
                  <Icon name="TrashIcon" size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <input type="text" placeholder="New extra name..." value={newExtraName} onChange={e => setNewExtraName(e.target.value)} className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Price (£)" value={newExtraPrice} onChange={e => setNewExtraPrice(e.target.value)} className="w-24 text-right border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={() => {
              if (newExtraName.trim()) {
                setExtras(p => [...p, { name: newExtraName.trim(), price: Number(newExtraPrice) || 0 }]);
                setNewExtraName(''); setNewExtraPrice('');
              }
            }} className="text-white text-sm font-semibold px-3 py-2 rounded-lg bg-amber-500">
              <Icon name="PlusIcon" size={16} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 max-w-2xl mt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Standard Adjustments (Fixed Fees)</h3>
          <div className="space-y-2 mb-4">
            {standardExtraCharges?.map((charge, i) => (
              <div key={i} className="flex items-center gap-3">
                <input type="text" value={charge.label} onChange={e => setStandardExtraCharges && setStandardExtraCharges(p => p.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <span className="text-gray-500">£</span>
                <input type="number" value={charge.amount} onChange={e => setStandardExtraCharges && setStandardExtraCharges(p => p.map((x, idx) => idx === i ? { ...x, amount: Number(e.target.value) } : x))} className="w-24 text-right border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <button onClick={() => setStandardExtraCharges && setStandardExtraCharges(p => p.filter((_, idx) => idx !== i))} className="p-2 text-gray-400 hover:text-red-500">
                  <Icon name="TrashIcon" size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <input type="text" placeholder="New standard charge..." value={newStdName} onChange={e => setNewStdName(e.target.value)} className="flex-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Amount (£)" value={newStdPrice} onChange={e => setNewStdPrice(e.target.value)} className="w-24 text-right border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <button onClick={() => {
              if (newStdName.trim() && setStandardExtraCharges) {
                setStandardExtraCharges(p => [...(p || []), { label: newStdName.trim(), amount: Number(newStdPrice) || 0 }]);
                setNewStdName(''); setNewStdPrice('');
              }
            }} className="text-white text-sm font-semibold px-3 py-2 rounded-lg bg-teal-500">
              <Icon name="PlusIcon" size={16} />
            </button>
          </div>
        </div>
        </>
      )}
      
      {activeTab === 'venue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Dry Hire Prices</h3>
              <div className="space-y-2">
                {dryHire.map((row, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={row.day} onChange={e => setDryHire(p => p.map((r, idx) => idx === i ? { ...r, day: e.target.value } : r))} className="w-1/3 border rounded px-2 py-1 text-xs" />
                    <input type="text" value={row.session} onChange={e => setDryHire(p => p.map((r, idx) => idx === i ? { ...r, session: e.target.value } : r))} className="w-1/3 border rounded px-2 py-1 text-xs" />
                    <input type="number" value={row.price} onChange={e => setDryHire(p => p.map((r, idx) => idx === i ? { ...r, price: Number(e.target.value) } : r))} className="w-1/3 border rounded px-2 py-1 text-xs text-right" />
                  </div>
                ))}
              </div>
           </div>
           
           <div className="space-y-4">
             <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Kids Pricing</h3>
                <div className="space-y-2">
                  {kidsPricing.map((kp, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={kp.ageRange} onChange={e => setKidsPricing(p => p.map((k, idx) => idx === i ? { ...k, ageRange: e.target.value } : k))} className="flex-1 border rounded px-2 py-1 text-xs" />
                      <input type="text" value={kp.price} onChange={e => setKidsPricing(p => p.map((k, idx) => idx === i ? { ...k, price: e.target.value } : k))} className="w-20 border rounded px-2 py-1 text-xs" />
                    </div>
                  ))}
                </div>
             </div>
             <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Table Service</h3>
                <div className="space-y-2">
                  {tableService.map((ts, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={ts.service} onChange={e => setTableService(p => p.map((t, idx) => idx === i ? { ...t, service: e.target.value } : t))} className="flex-1 border rounded px-2 py-1 text-xs" />
                      <input type="text" value={ts.price} onChange={e => setTableService(p => p.map((t, idx) => idx === i ? { ...t, price: e.target.value } : t))} className="w-20 border rounded px-2 py-1 text-xs" />
                    </div>
                  ))}
                </div>
             </div>
           </div>
        </div>
      )}

      {/* ─── CENTERED DELETE CONFIRMATION MODAL ─── */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-rose-50 text-rose-500">
              <Icon name="TrashIcon" size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Remove Package</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to remove <span className="font-semibold text-gray-900">"{deleteConfirmTarget.name}"</span>?
            </p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPackages(p => p.filter((_, idx) => idx !== deleteConfirmTarget.index));
                  setDeleteConfirmTarget(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
