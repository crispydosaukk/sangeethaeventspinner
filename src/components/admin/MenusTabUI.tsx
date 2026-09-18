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
  save: () => void;
  isSaving: boolean;
};

export default function MenusTabUI({
  packages, setPackages, categories, setCategories, liveMenu, setLiveMenu,
  extras, setExtras, standardExtraCharges, setStandardExtraCharges, tableService, setTableService, kidsPricing, setKidsPricing,
  dryHire, setDryHire, save, isSaving
}: Props) {
  type Tab = 'packages' | 'categories' | 'live' | 'extras' | 'venue';
  const [activeTab, setActiveTab] = useState<Tab>('packages');

  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');
  const [newStdName, setNewStdName] = useState('');
  const [newStdPrice, setNewStdPrice] = useState('');

  const [newCategoryItem, setNewCategoryItem] = useState<{ [key: string]: string }>({});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-gray-500">Edit menus, packages, and prices.</p>
        <button onClick={save} disabled={isSaving} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-white shadow-md transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed" style={{ background: 'linear-gradient(135deg, #ED1C24, #F5A623)' }}>
          <Icon name="CloudArrowUpIcon" size={16} />
          {isSaving ? 'Saving...' : 'Save Changes to Website'}
        </button>
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
          {packages.map((pkg, i) => (
            <div key={pkg.id || i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex justify-between items-center mb-3">
                <input type="text" value={pkg.name} onChange={e => setPackages(p => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} className="text-lg font-bold border border-gray-200 rounded-lg px-3 py-1.5 focus:border-emerald-500 focus:outline-none w-1/2 text-gray-900 bg-white shadow-2xs" />
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">£</span>
                  <input type="number" value={pkg.pricePerPerson} onChange={e => setPackages(p => p.map((x, idx) => idx === i ? { ...x, pricePerPerson: Number(e.target.value) } : x))} className="w-24 text-right border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-emerald-500 focus:outline-none font-bold text-emerald-700 bg-white shadow-2xs" />
                  <span className="text-sm text-gray-500">/pp</span>
                </div>
              </div>
              <div className="mb-3">
                 <label className="text-xs text-gray-500">Items Included (one per line)</label>
                 <textarea rows={6} value={(pkg.items || []).join('\n')} onChange={e => setPackages(p => p.map((x, idx) => idx === i ? { ...x, items: e.target.value.split('\n') } : x))} className="w-full text-sm border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 mt-1 text-gray-900 bg-white font-medium shadow-2xs" />
              </div>
              <div>
                 <label className="text-xs text-gray-500">Tag (e.g. Additional 20% VAT Tax)</label>
                 <input type="text" value={pkg.tag || ''} onChange={e => setPackages(p => p.map((x, idx) => idx === i ? { ...x, tag: e.target.value } : x))} className="w-full text-sm border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 mt-1 text-gray-900 bg-white font-medium shadow-2xs" />
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
    </div>
  );
}
