import { useEffect, useMemo, useState } from 'react';
import { Copy, Search, RefreshCw, Images, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProductMedia from '../components/ProductMedia';
import { getAdminCatalogProducts } from '../services/catalog';
import { mediaUrls } from '../utils';

function canonicalAssetKey(value) {
  try {
    const url = new URL(value);
    url.search = ''; url.hash = '';
    if (/(^|\.)cloudinary\.com$/i.test(url.hostname)) {
      const parts = url.pathname.split('/');
      const uploadIndex = parts.indexOf('upload');
      const versionIndex = parts.findIndex((part,index) => index > uploadIndex && /^v\d+$/.test(part));
      if (uploadIndex >= 0 && versionIndex > uploadIndex) url.pathname = [...parts.slice(0,uploadIndex+1),...parts.slice(versionIndex)].join('/');
    }
    return url.origin + url.pathname;
  } catch { return String(value || '').split(/[?#]/,1)[0]; }
}
function looksVideo(url) { return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('/video/upload/'); }

export default function AdminMediaLibrary() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setProducts(await getAdminCatalogProducts()); }
    catch (err) { setError(err?.message || 'Media references could not be loaded from Firestore.'); setProducts([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const assets = useMemo(() => {
    const byKey = new Map();
    products.forEach(product => {
      const urls = mediaUrls(product);
      if (urls.length) {
        urls.forEach(url => {
          const key = 'url:' + canonicalAssetKey(url);
          const existing = byKey.get(key);
          if (existing) {
            if (!existing.products.some(item => item.id === product.id)) existing.products.push(product);
            return;
          }
          byKey.set(key, { id: key, url, imageIndex: undefined, name: product.name || 'Unnamed product', products: [product], isVideo: looksVideo(url), isAtlasTile: false });
        });
        return;
      }
      const indexes = Array.isArray(product.imageIndexes) && product.imageIndexes.length
        ? product.imageIndexes
        : product.imageIndex !== undefined ? [product.imageIndex] : [];
      indexes.forEach(index => {
        const key = 'atlas:' + index;
        const existing = byKey.get(key);
        if (existing) {
          if (!existing.products.some(item => item.id === product.id)) existing.products.push(product);
          return;
        }
        byKey.set(key, { id: key, url: '', imageIndex: index, name: product.name || 'Photo atlas tile', products: [product], isVideo: false, isAtlasTile: true });
      });
    });
    return [...byKey.values()];
  }, [products]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter(asset => {
      if (kind === 'videos' && !asset.isVideo) return false;
      if (kind === 'images' && asset.isVideo) return false;
      if (!term) return true;
      return [asset.name, asset.url, ...asset.products.map(product => product.sku || '')].join(' ').toLowerCase().includes(term);
    });
  }, [assets, search, kind]);

  const copy = async url => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Media URL copied');
    } catch { toast.error('Clipboard access is unavailable in this browser.'); }
  };

  return <section>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Media Library</h1>
        <p className="mt-1 text-sm text-slate-500">Unique referenced assets from the real catalogue, including the preserved product photo atlas. Shared assets are shown once with all linked products.</p>
      </div>
      <div className="flex gap-2">
        <Link to="/admin/products" className="dash-btn-primary"><ImageIcon size={16} /> Manage product photos</Link>
        <button className="dash-btn-ghost" onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>
    </div>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
    <div className="dash-card mb-5 grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_180px]">
      <label className="relative block"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="dash-field pl-10" placeholder="Search product, SKU or asset URL…" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <select className="dash-field" value={kind} onChange={event => setKind(event.target.value)} aria-label="Filter media type"><option value="all">All media</option><option value="images">Images only</option><option value="videos">Videos only</option></select>
    </div>
    <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-500">
      <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">{assets.length} unique assets</span>
      <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">{assets.filter(item => item.isAtlasTile).length} atlas tiles</span>
      <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">{assets.filter(item => !item.isAtlasTile && !item.isVideo).length} uploaded images</span>
      <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200">{assets.filter(item => item.isVideo).length} videos</span>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {loading ? Array.from({length:10},(_,i)=><div key={i} className="skeleton aspect-[4/5] rounded-xl" />)
        : filtered.map(asset => <article key={asset.id} className="overflow-hidden rounded-xl border border-rose-100 bg-white shadow-sm">
          <div className="aspect-[4/4.6] overflow-hidden bg-rose-50">
            <ProductMedia url={asset.url} productName={asset.name} imageIndex={asset.imageIndex} className="transition-transform duration-500 hover:scale-105" />
          </div>
          <div className="p-3">
            <p className="truncate text-sm font-semibold text-slate-900" title={asset.name}>{asset.name}</p>
            <p className="mt-1 truncate text-[11px] text-slate-500">{asset.products.map(p => p.sku || p.id).join(', ')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {asset.url && <button className="dash-btn-ghost !px-2.5 !py-1.5 text-xs" onClick={() => copy(asset.url)}><Copy size={13} /> Copy URL</button>}
              <Link to="/admin/products" className="inline-flex items-center gap-1 rounded-lg border border-rose-100 px-2.5 py-1.5 text-xs font-semibold text-[#9f1239] hover:bg-rose-50">Products <ExternalLink size={12} /></Link>
            </div>
          </div>
        </article>)}
    </div>
    {!loading && !error && !filtered.length && <div className="dash-card mt-3 p-10 text-center"><Images size={28} className="mx-auto mb-3 text-slate-300" /><p className="font-semibold text-slate-700">No matching media assets</p><p className="mt-1 text-sm text-slate-500">Try a different search or media filter.</p></div>}
    {!loading && !error && <p className="mt-4 text-xs text-slate-500">This page only inventories referenced assets. It does not delete files from Cloudinary or break existing product references.</p>}
  </section>;
}
