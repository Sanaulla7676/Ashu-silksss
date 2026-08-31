import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ImagePlus, Eye, EyeOff } from 'lucide-react';
import photoManifest from '../data/photo-import-2026-08-31.json';

const USED_KEY = 'ashu_import_used_urls';
const loadUsed = () => {
  try { return new Set(JSON.parse(localStorage.getItem(USED_KEY) || '[]')); }
  catch { return new Set(); }
};
const saveUsed = set => localStorage.setItem(USED_KEY, JSON.stringify([...set]));

export default function AdminImport() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [used, setUsed] = useState(loadUsed);
  const [hideUsed, setHideUsed] = useState(true);

  const visible = useMemo(
    () => hideUsed ? photoManifest.filter(p => !used.has(p.url)) : photoManifest,
    [hideUsed, used]
  );

  const toggle = url => {
    setSelected(sel => sel.includes(url) ? sel.filter(u => u !== url) : [...sel, url]);
  };

  const createFromSelected = () => {
    if (!selected.length) return;
    const next = new Set(used);
    selected.forEach(u => next.add(u));
    setUsed(next);
    saveUsed(next);
    navigate('/admin/products', { state: { media: selected } });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Import Photos</h1>
          <p className="text-sm text-slate-500">
            {photoManifest.length} photos uploaded from your last batch, {used.size} already turned into products.
            Click the ones that belong to the same saree, then create the product.
          </p>
        </div>
        <button className="dash-btn-ghost" onClick={() => setHideUsed(h => !h)}>
          {hideUsed ? <Eye size={16} /> : <EyeOff size={16} />} {hideUsed ? 'Show used photos' : 'Hide used photos'}
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <span className="text-sm font-medium text-indigo-900">
          {selected.length ? `${selected.length} photo${selected.length > 1 ? 's' : ''} selected` : 'Select 1–4 photos of the same saree'}
        </span>
        <button className="dash-btn-primary" onClick={createFromSelected} disabled={!selected.length}>
          <ImagePlus size={16} /> Create product from selected
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {visible.map(p => {
          const isSelected = selected.includes(p.url);
          const isUsed = used.has(p.url);
          return (
            <button
              key={p.url}
              type="button"
              onClick={() => toggle(p.url)}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all ${
                isSelected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent'
              }`}
            >
              <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              {isUsed && <div className="absolute inset-0 bg-black/40" />}
              {isSelected && (
                <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-white">
                  <Check size={14} />
                </span>
              )}
              {isUsed && (
                <span className="absolute bottom-1.5 left-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[0.65rem] font-bold text-slate-700">Used</span>
              )}
            </button>
          );
        })}
      </div>

      {!visible.length && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          All photos from this batch have been turned into products. Toggle "Show used photos" to review them again.
        </div>
      )}
    </div>
  );
}
