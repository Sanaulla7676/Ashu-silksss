import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, ImageOff, LoaderCircle, RefreshCw, Search, Square, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductMedia from '../components/ProductMedia';
import { firebaseReady } from '../firebase';
import { createCatalogProduct, getAdminCatalogProducts, updateCatalogProduct } from '../services/catalog';
import { isVideoMedia, mediaUrls, productPhotoCount } from '../utils';

export default function AdminProductPhotos() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await getAdminCatalogProducts());
      setSelected(new Set());
    } catch (err) {
      setError(err?.message || 'Product photos could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(product => !term || [product.name, product.sku, product.category]
      .some(value => String(value || '').toLowerCase().includes(term)));
  }, [products, search]);

  const withPhotos = visible.filter(product => productPhotoCount(product) > 0);
  const totalViews = products.reduce((sum, product) => sum + productPhotoCount(product), 0);
  const selectedProducts = withPhotos.filter(product => selected.has(String(product.id)));
  const allVisibleSelected = withPhotos.length > 0 && withPhotos.every(product => selected.has(String(product.id)));

  const toggle = id => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(String(id))) next.delete(String(id));
    else next.add(String(id));
    return next;
  });

  const toggleAll = () => setSelected(prev => {
    const next = new Set(prev);
    if (allVisibleSelected) withPhotos.forEach(product => next.delete(String(product.id)));
    else withPhotos.forEach(product => next.add(String(product.id)));
    return next;
  });

  const clearProductPhotos = async product => {
    const videos = mediaUrls(product).filter(isVideoMedia);
    const changes = { media: videos, imageIndexes: [] };
    if (product.isStaticFallback) {
      const payload = { ...product, ...changes };
      delete payload.id;
      delete payload.imageIndex;
      delete payload.isStaticFallback;
      delete payload.isFallbackProduct;
      await createCatalogProduct(payload);
    } else {
      await updateCatalogProduct(product.id, changes);
    }
  };

  const removePhotos = async targets => {
    const items = targets.filter(product => productPhotoCount(product) > 0);
    if (!items.length || busy) return;
    const total = items.reduce((sum, product) => sum + productPhotoCount(product), 0);
    const names = items.slice(0, 4).map(product => product.name || 'Untitled product').join(', ');
    const more = items.length > 4 ? ' and ' + (items.length - 4) + ' more' : '';
    if (!window.confirm('Remove all ' + total + ' photo view(s) from ' + items.length + ' product(s)?\n\n' + names + more + '\n\nVideos and product details will be kept. Original photo files remain in media storage; only product assignments are removed.')) return;

    setBusy(true);
    setError('');
    let done = 0;
    try {
      for (const product of items) {
        await clearProductPhotos(product);
        done += 1;
      }
      toast.success('Removed photo assignments from ' + done + ' product(s).');
      await load();
    } catch (err) {
      setError('Updated ' + done + ' product(s), then stopped: ' + (err?.message || 'Unknown error.'));
      await load();
    } finally {
      setBusy(false);
    }
  };

  return <section>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Product photo manager</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Remove all assigned photos from one product or clear photos across several products. Product details and videos are preserved.</p>
      </div>
      <div className="flex gap-2">
        <Link to="/admin/media" className="dash-btn-ghost">Open media library</Link>
        <button type="button" className="dash-btn-ghost" onClick={load} disabled={loading || busy}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>
    </div>

    {!firebaseReady && <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Firebase is not configured. Product photo assignments cannot be changed.</div>}
    {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}

    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <div className="dash-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Products</p><p className="mt-1 text-2xl font-bold text-slate-900">{products.length}</p></div>
      <div className="dash-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Products with photos</p><p className="mt-1 text-2xl font-bold text-slate-900">{products.filter(product => productPhotoCount(product) > 0).length}</p></div>
      <div className="dash-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned photo views</p><p className="mt-1 text-2xl font-bold text-slate-900">{totalViews}</p></div>
    </div>

    <div className="dash-card mb-5 grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
      <label className="relative block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="dash-field pl-10" placeholder="Search product name, SKU or category…" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <button type="button" className="dash-btn-ghost" onClick={toggleAll} disabled={!withPhotos.length || busy}>{allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />} {allVisibleSelected ? 'Clear selection' : 'Select all visible'}</button>
      <button type="button" className="dash-btn-danger" onClick={() => removePhotos(selectedProducts)} disabled={!selectedProducts.length || busy || !firebaseReady}>{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />} Remove all from {selectedProducts.length} selected</button>
    </div>

    <div className="mb-3 flex items-center justify-between text-xs text-slate-500"><span>{withPhotos.length} product(s) with photos</span><span>{selectedProducts.length} selected</span></div>
    {loading ? <div className="dash-card p-10 text-center"><LoaderCircle size={24} className="mx-auto animate-spin text-rose-700" /><p className="mt-2 text-sm text-slate-500">Loading product photo assignments…</p></div>
      : withPhotos.length ? <div className="grid gap-3">
        {withPhotos.map(product => {
          const photoCount = productPhotoCount(product);
          const firstImage = mediaUrls(product).find(url => !isVideoMedia(url)) || '';
          return <article key={product.id} className="dash-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={selected.has(String(product.id))} onChange={() => toggle(product.id)} disabled={busy} className="h-4 w-4 accent-rose-700" aria-label={'Select ' + product.name} /><span className="sr-only">Select product</span></label>
            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-rose-50"><ProductMedia url={firstImage} productName={product.name || 'Product'} imageIndex={product.imageIndexes?.[0] ?? product.imageIndex} /></div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900">{product.name || 'Untitled product'}</h2>
              <p className="mt-1 text-xs text-slate-500">{product.sku || 'No SKU'} · {product.category || 'No category'} · {product.status === 'draft' ? 'Draft' : 'Active'}</p>
              <p className="mt-1 text-sm text-slate-600">{photoCount} photo view(s) assigned</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link to={'/admin/products/' + encodeURIComponent(product.id) + '/edit'} className="dash-btn-ghost">Edit photos</Link>
              <button type="button" className="dash-btn-danger" onClick={() => removePhotos([product])} disabled={busy || !firebaseReady}><Trash2 size={14} /> Remove all photos</button>
            </div>
          </article>;
        })}
      </div>
      : <div className="dash-card p-10 text-center"><ImageOff size={28} className="mx-auto mb-3 text-slate-300" /><p className="font-semibold text-slate-800">No products with assigned photos</p><p className="mt-1 text-sm text-slate-500">Try another search or add photos from the product editor.</p></div>}

    <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">Safety note: this page unassigns photos from product records. It does not permanently delete original Cloudinary files. This avoids destroying a shared image that may still be in use elsewhere.</p>
  </section>;
}
