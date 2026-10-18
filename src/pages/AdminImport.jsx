import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Check, ImagePlus, Eye, EyeOff, AlertTriangle, ExternalLink } from 'lucide-react';
import photoManifest from '../data/photo-import-2026-08-31.json';

const USED_KEY = 'ashu_import_used_urls';
const loadUsed = () => {
  try { return new Set(JSON.parse(localStorage.getItem(USED_KEY) || '[]')); }
  catch { return new Set(); }
};

export default function AdminImport() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [used, setUsed] = useState(loadUsed);
  const [hideUsed, setHideUsed] = useState(false);
  const [failedUrls, setFailedUrls] = useState([]);

  const visible = useMemo(
    () => hideUsed ? photoManifest.filter(p => !used.has(p.url)) : photoManifest,
    [hideUsed, used]
  );

  const toggle = url => {
    if (failedUrls.includes(url)) return;
    setSelected(sel => {
      if (sel.includes(url)) return sel.filter(u => u !== url);
      if (sel.length >= 4) { toast.error('Select up to four photos of the same product.'); return sel; }
      return [...sel, url];
    });
  };

  const createFromSelected = () => {
    if (!selected.length) return;
    // Mark these URLs as used only after the product form saves successfully.
    navigate('/admin/products/new', { state: { media: selected, importSourceUrls: selected } });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Import Photos</h1>
          <p className="text-sm text-slate-500">
            {visible.length} of {photoManifest.length} photos shown · {used.size} marked as previously used.
            Used photos remain visible by default. Select up to four genuine views of the same saree, then create the product.
          </p>
        </div>
        <button className="dash-btn-ghost" onClick={() => setHideUsed(h => !h)}>
          {hideUsed ? <Eye size={16} /> : <EyeOff size={16} />} {hideUsed ? 'Show all photos' : 'Show unused only'}
        </button>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <span className="text-sm font-medium text-indigo-900">
          {selected.length ? `${selected.length}/4 photos selected` : 'Select up to 4 photos of the same saree'}
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
              disabled={failedUrls.includes(p.url)}
              aria-label={`Select ${p.file}`}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg border-2 bg-white text-left transition-all disabled:cursor-not-allowed ${
                isSelected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-transparent'
              }`}
            >
              {!failedUrls.includes(p.url) ? (
                <img
                  src={p.url}
                  alt={p.file || 'Imported product photo'}
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                  onError={() => setFailedUrls(current => current.includes(p.url) ? current : [...current, p.url])}
                />
              ) : (
                <span className="flex h-full flex-col items-center justify-center gap-2 bg-rose-50 p-2 text-center text-rose-800">
                  <AlertTriangle size={19} />
                  <span className="text-[10px] font-bold leading-4">Image unavailable</span>
                </span>
              )}
              {isUsed && <div className="pointer-events-none absolute inset-0 bg-black/25" />}
              {isSelected && <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-white"><Check size={14} /></span>}
              {isUsed && <span className="absolute bottom-1.5 left-1.5 rounded bg-white/95 px-1.5 py-0.5 text-[0.65rem] font-bold text-slate-700">Used</span>}
              {failedUrls.includes(p.url) && <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-rose-900/90 px-1 py-1 text-[9px] font-bold text-white"><AlertTriangle size={11} /> Broken source</span>}
            </button>
          );
        })}
      </div>

      {!visible.length && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No photos match this view. Choose "Show all photos" to include previously used images.
        </div>
      )}
      {failedUrls.length > 0 && (
        <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">{failedUrls.length} saved photo URL(s) could not be loaded.</p>
          <p className="mt-1">These particular image links may no longer be available on the image host. They are disabled so broken photos are not added to a listing. Re-upload the original files from Add product to replace them.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {failedUrls.slice(0, 5).map(url => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold underline">Open original <ExternalLink size={11} /></a>)}
          </div>
        </div>
      )}
    </div>
  );
}
