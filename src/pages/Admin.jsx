import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Trash2, RefreshCw, Save, Upload, X, ImagePlus, Sparkles, FolderTree, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminCatalogProducts, createCatalogProduct, updateCatalogProduct, deleteCatalogProduct } from '../services/catalog';
import { firebaseReady } from '../firebase';
import { CATALOGUE_FIXES } from '../data/product-catalogue-fixes';
import { NEW_ARRIVALS } from '../data/new-arrivals';
import { PHOTO_UPDATES } from '../data/photo-updates';
import { useCategories } from '../context/CategoryContext';
import { mediaUrl, mediaUrls, productPhotoCount } from '../utils';
import ProductMedia from '../components/ProductMedia';

const empty = {
  name: '', brand: 'Ashu Silks', category: 'Kanjeevaram Silk', sku: '', status: 'draft',
  price: '', mrp: '', priceOnRequest: false, gstPercent: '5', stock: '', stockOnRequest: false,
  colour: '', fabric: '', pattern: '', occasion: '', workType: '', blousePiece: 'Included',
  sareeLength: '6.3 metres with blouse piece', washCare: 'Dry clean only', countryOfOrigin: 'India', weight: '',
  description: '', highlights: '', tags: '',
  media: '', video: '', featured: false,
};
const blouseOptions = ['Included', 'Not included', 'Running blouse fabric'];
const patternOptions = ['Checked', 'Striped', 'Zari Woven', 'Floral', 'Solid', 'Printed', 'Embroidered', 'Temple Border'];
const IMPORT_USED_KEY = 'ashu_import_used_urls';

function persistableProduct(product) {
  const data = { ...product };
  delete data.id;
  delete data.isStaticFallback;
  delete data.isFallbackProduct;
  return data;
}

function readableAdminError(error) {
  const message = error?.message || 'An unexpected error occurred.';
  if (error?.code === 'permission-denied' || /missing or insufficient permissions|permission denied/i.test(message)) {
    return 'Firestore denied this action. Confirm the signed-in store-owner account has the Firebase custom claim admin=true, then sign out and sign in again. Keep the Firestore security rules restricted.';
  }
  return message;
}


export default function Admin() {
  const { categories } = useCategories();
  const [products, setProducts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [stockDrafts, setStockDrafts] = useState({});
  const [priceDrafts, setPriceDrafts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [qualityFilter, setQualityFilter] = useState('all');

  const load = async () => {
    setBusy(true); setError('');
    try { setProducts(await getAdminCatalogProducts()); }
    catch (e) { setError(readableAdminError(e)); }
    finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);

  const saveCatalogFields = async (product, changes) => {
    if (product.isStaticFallback) {
      await createCatalogProduct({ ...persistableProduct(product), ...changes, sku: product.sku });
    } else {
      await updateCatalogProduct(product.id, changes);
    }
  };

  const savePrice = async product => {
    const raw = priceDrafts[product.id];
    const price = Number(raw);
    if (raw === undefined || String(raw).trim() === '' || !Number.isFinite(price) || price <= 0) {
      toast.error('Enter a selling price above ₹0.');
      return;
    }
    setBusy(true);
    try {
      await saveCatalogFields(product, {
        price,
        mrp: Math.max(Number(product.mrp) || 0, price),
        priceOnRequest: false,
      });
      setPriceDrafts(d => { const next = { ...d }; delete next[product.id]; return next; });
      toast.success(`${product.name || 'Product'} price updated and made visible`);
      await load();
    } catch (e) { toast.error(readableAdminError(e)); }
    finally { setBusy(false); }
  };

  const remove = async product => {
    const isFallback = Boolean(product.isFallbackProduct || product.isStaticFallback);
    if (!confirm(isFallback
      ? 'Hide this product from the storefront? It will be saved as a draft so its fallback copy cannot reappear.'
      : 'Permanently delete this product?')) return;
    setBusy(true);
    try {
      if (product.isStaticFallback) await saveCatalogFields(product, { status: 'draft' });
      else if (product.isFallbackProduct) await updateCatalogProduct(product.id, { status: 'draft' });
      else await deleteCatalogProduct(product.id);
      toast.success(isFallback ? 'Product hidden as a draft' : 'Product deleted');
      await load();
    } catch (e) { setError(readableAdminError(e)); }
    finally { setBusy(false); }
  };

  // Reviewed products whose name, description or category is still unapplied.
  const pendingFixes = CATALOGUE_FIXES.filter(fix => {
    const product = products.find(p => p.id === fix.id);
    if (!product || product.isStaticFallback) return false;
    return product.name !== fix.name
      || product.description !== fix.description
      || product.category !== fix.category;
  });

  const applyFixes = async () => {
    if (!pendingFixes.length) return;
    setBusy(true); setError('');
    let done = 0;
    try {
      for (const fix of pendingFixes) {
        await updateCatalogProduct(fix.id, {
          name: fix.name,
          description: fix.description,
          category: fix.category,
        });
        done += 1;
      }
      toast.success(`${done} product${done === 1 ? '' : 's'} updated`);
      await load();
    } catch (e) {
      setError(`Stopped after ${done} update(s): ${readableAdminError(e)}`);
    } finally { setBusy(false); }
  };

  // Sarees identified from photos that aren't in the catalogue yet. Matched on
  // name so the button stops offering them once they have been created.
  const pendingArrivals = NEW_ARRIVALS.filter(
    arrival => !products.some(p => p.name === arrival.name),
  );

  const createArrivals = async () => {
    if (!pendingArrivals.length) return;
    setBusy(true); setError('');
    let done = 0;
    try {
      for (const arrival of pendingArrivals) {
        await createCatalogProduct({
          ...empty,
          name: arrival.name,
          category: arrival.category,
          colour: arrival.colour,
          fabric: arrival.fabric,
          pattern: arrival.pattern,
          workType: arrival.workType,
          occasion: arrival.occasion,
          description: arrival.description,
          media: arrival.media,
          // Photos are attached; draft until a price and stock are set.
          status: 'draft',
          sku: '',
          price: 0,
          mrp: 0,
          gstPercent: 5,
          stock: 0,
          weight: 0,
          highlights: [],
          tags: [],
          featured: false,
        });
        done += 1;
      }
      toast.success(`${done} saree${done === 1 ? '' : 's'} created as drafts`);
      await load();
    } catch (e) {
      setError(`Stopped after creating ${done}: ${e.message}`);
    } finally { setBusy(false); }
  };

  // Sarees already in the catalogue that were photographed again: they gain the
  // new photographs after the ones they already have, and move category when the
  // entry names one.
  const mediaOf = mediaUrls;
  const pendingPhotos = PHOTO_UPDATES.filter(update => {
    const product = products.find(p => p.id === update.id);
    if (!product || product.isStaticFallback) return false;
    const current = mediaOf(product);
    return (update.category && product.category !== update.category)
      || (update.name && product.name !== update.name)
      || update.media.some(url => !current.includes(url));
  });

  const applyPhotoUpdates = async () => {
    if (!pendingPhotos.length) return;
    setBusy(true); setError('');
    let done = 0;
    try {
      for (const update of pendingPhotos) {
        const current = mediaOf(products.find(p => p.id === update.id));
        await updateCatalogProduct(update.id, {
          media: [...current, ...update.media.filter(url => !current.includes(url))],
          ...(update.category ? { category: update.category } : {}),
          ...(update.name ? { name: update.name } : {}),
        });
        done += 1;
      }
      toast.success(`${done} saree${done === 1 ? '' : 's'} updated`);
      await load();
    } catch (e) {
      setError(`Stopped after ${done} update(s): ${readableAdminError(e)}`);
    } finally { setBusy(false); }
  };

  const draftProducts = products.filter(p => (p.status || 'active') === 'draft');
  const photoCount = productPhotoCount;
  const productsBelowPhotoMinimum = products.filter(p => photoCount(p) < 3);
  const activeProductsBelowPhotoMinimum = productsBelowPhotoMinimum.filter(p => (p.status || 'active') === 'active');
  // Publishing is blocked until the listing has three assigned product photos.
  const readyDrafts = draftProducts.filter(p =>
    photoCount(p) >= 3 && (p.priceOnRequest || Number(p.price) > 0) && (p.stockOnRequest || Number(p.stock ?? 0) > 0),
  );
  const incompleteDrafts = draftProducts.filter(p => !readyDrafts.includes(p));

  const publishDrafts = async () => {
    if (!readyDrafts.length) return;
    setBusy(true); setError('');
    let done = 0;
    try {
      for (const p of readyDrafts) {
        await updateCatalogProduct(p.id, { status: 'active' });
        done += 1;
      }
      toast.success(`${done} complete product${done === 1 ? '' : 's'} published`);
      await load();
    } catch (e) {
      setError(`Stopped after ${done} update(s): ${readableAdminError(e)}`);
    } finally { setBusy(false); }
  };

  const matchesBaseFilters = product => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || [product.name, product.sku, product.category, product.colour, product.fabric, product.pattern, product.workType, product.description, ...(Array.isArray(product.tags) ? product.tags : [product.tags])]
      .some(value => String(value || '').toLowerCase().includes(q));
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || (product.status || 'active') === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  };
  const baseProducts = products.filter(matchesBaseFilters);
  const hasPrice = product => Boolean(product.priceOnRequest) || (Number.isFinite(Number(product.price)) && Number(product.price) > 0);
  const hasAnyPrice = product => Number.isFinite(Number(product.price)) && Number(product.price) > 0;
  const isLowStock = product => !product.stockOnRequest && Number(product.stock ?? 0) > 0 && Number(product.stock ?? 0) <= 3;
  const isOutOfStock = product => !product.stockOnRequest && Number(product.stock ?? 0) <= 0;
  const qualityOptions = [
    { id: 'all', label: 'All products', count: baseProducts.length },
    { id: 'single-photo', label: 'Exactly 1 photo', count: baseProducts.filter(product => photoCount(product) === 1).length },
    { id: 'needs-photos', label: 'Needs photos (<3)', count: baseProducts.filter(product => photoCount(product) < 3).length },
    { id: 'missing-price', label: 'Missing price', count: baseProducts.filter(product => !product.priceOnRequest && !hasAnyPrice(product)).length },
    { id: 'low-stock', label: 'Low stock (1–3)', count: baseProducts.filter(isLowStock).length },
    { id: 'out-of-stock', label: 'Out of stock', count: baseProducts.filter(isOutOfStock).length },
    { id: 'price-on-request', label: 'Price on request', count: baseProducts.filter(product => product.priceOnRequest).length },
  ];
  const visibleProducts = baseProducts.filter(product => {
    if (qualityFilter === 'single-photo') return photoCount(product) === 1;
    if (qualityFilter === 'needs-photos') return photoCount(product) < 3;
    if (qualityFilter === 'missing-price') return !product.priceOnRequest && !hasAnyPrice(product);
    if (qualityFilter === 'low-stock') return isLowStock(product);
    if (qualityFilter === 'out-of-stock') return isOutOfStock(product);
    if (qualityFilter === 'price-on-request') return Boolean(product.priceOnRequest);
    return true;
  });

  const stockValue = p => stockDrafts[p.id] ?? String(p.stock ?? 0);
  const setStockDraft = (id, v) => setStockDrafts(d => ({ ...d, [id]: v }));
  const saveStock = async p => {
    const value = Number(stockDrafts[p.id]);
    if (!Number.isInteger(value) || value < 0) { toast.error('Enter a whole-number stock quantity of zero or more.'); return; }
    setBusy(true);
    try {
      await saveCatalogFields(p, { stock: value, stockOnRequest: false });
      toast.success((p.name || 'Product') + ' stock updated');
      setStockDrafts(d => { const next = { ...d }; delete next[p.id]; return next; });
      await load();
    } catch (e) { toast.error(readableAdminError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div>
      {!firebaseReady && (
        <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">Product management is unavailable because Firebase is not configured.</p>
          <p className="mt-1">Restore the existing Firebase production values in Vercel and redeploy. Product reads and writes will fail until then; existing catalogue data has not been changed.</p>
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">Manage catalogue, stock, pricing and images. Active products appear when they have stock above 0 or availability is set to on enquiry.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><Link to="/admin/import" className="dash-btn-ghost inline-flex items-center gap-2"><ImagePlus size={16} /> Import photos</Link><Link to="/admin/products/new" className="dash-btn-primary inline-flex items-center gap-2"><Plus size={16} /> Add product</Link><button className="dash-btn-ghost" onClick={load} disabled={busy}><RefreshCw size={16} /> Refresh</button></div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">{error}</div>}

      {productsBelowPhotoMinimum.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <div className="flex items-start gap-3">
            <ImagePlus size={19} className="mt-0.5 shrink-0" />
            <div>
              <b>Photo coverage needs attention: {productsBelowPhotoMinimum.length} product(s) have fewer than 3 photos.</b>
              <p className="mt-1">
                {activeProductsBelowPhotoMinimum.length} are currently active. Add three genuinely different views per saree
                (full drape, pallu/border and blouse/detail). Existing active products stay live until you update them;
                new products start as drafts, and publishing is blocked until three photo views are assigned.
              </p>
            </div>
          </div>
        </div>
      )}

      {pendingFixes.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm text-indigo-900">
            <FolderTree size={18} className="mt-0.5 shrink-0" />
            <p>
              <b>{pendingFixes.length} product{pendingFixes.length === 1 ? '' : 's'}</b> have a reviewed name, description
              and category ready to apply — written from each saree's own photos. Products outside that review are left
              untouched.
            </p>
          </div>
          <button className="dash-btn-primary shrink-0" onClick={applyFixes} disabled={busy}>
            <FolderTree size={16} /> {busy ? 'Applying...' : 'Apply names & categories'}
          </button>
        </div>
      )}

      {pendingPhotos.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm text-violet-900">
            <ImagePlus size={18} className="mt-0.5 shrink-0" />
            <p>
              <b>{pendingPhotos.length} saree{pendingPhotos.length === 1 ? '' : 's'}</b> already on the site were
              photographed again. This adds the new photos after their existing ones — price, stock and descriptions
              stay as they are.
            </p>
          </div>
          <button className="dash-btn-primary shrink-0" onClick={applyPhotoUpdates} disabled={busy}>
            <ImagePlus size={16} /> {busy ? 'Updating...' : `Add photos to ${pendingPhotos.length}`}
          </button>
        </div>
      )}

      {pendingArrivals.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm text-emerald-900">
            <Sparkles size={18} className="mt-0.5 shrink-0" />
            <p>
              <b>{pendingArrivals.length} new saree{pendingArrivals.length === 1 ? '' : 's'}</b> identified from your latest
              photos, with <b>photos already uploaded</b> plus names, colours, fabric and descriptions written from each
              one. They arrive as <b>drafts</b> — set a price and stock on each, then switch it to Active.
            </p>
          </div>
          <button className="dash-btn-primary shrink-0" onClick={createArrivals} disabled={busy}>
            <Plus size={16} /> {busy ? 'Creating...' : `Create ${pendingArrivals.length} sarees`}
          </button>
        </div>
      )}

      {draftProducts.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm text-amber-900">
            <Eye size={18} className="mt-0.5 shrink-0" />
            <div>
              <p>
                <b>{draftProducts.length} draft{draftProducts.length === 1 ? '' : 's'}</b> can be switched to Active.
              </p>
              {incompleteDrafts.length > 0 && (
                <p className="mt-1 text-amber-800">
                  {incompleteDrafts.length} need a photo, a confirmed price or “Price on request”, and a stock quantity or “Availability on enquiry”. They’ll remain drafts until those details are set.
                </p>
              )}
            </div>
          </div>
          <button className="dash-btn-primary shrink-0" onClick={publishDrafts} disabled={busy || !readyDrafts.length}>
            <Eye size={16} /> {busy ? 'Publishing...' : `Publish ${readyDrafts.length} ready product${readyDrafts.length === 1 ? '' : 's'}`}
          </button>
        </div>
      )}

      <div className="grid gap-5">
        <div className="grid content-start gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Products ({visibleProducts.length}{visibleProducts.length !== products.length ? ` of ${products.length}` : ''})</h2>
            <Link to="/admin/import" className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline">
              <Sparkles size={14} /> Import photos
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.6fr)_minmax(120px,0.4fr)]">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input className="min-w-0 flex-1 py-2 text-sm outline-none" placeholder="Search name, SKU, material or tags" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </label>
            <select className="dash-field" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} aria-label="Filter by category">
              <option value="All">All categories</option>
              {[...new Set([...categories, ...products.map(p => p.category).filter(Boolean)])].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="dash-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
              <option value="All">All statuses</option><option value="active">Active</option><option value="draft">Draft</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Product health filters">
            {qualityOptions.map(option => (
              <button
                key={option.id}
                type="button"
                aria-pressed={qualityFilter === option.id}
                onClick={() => setQualityFilter(option.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${qualityFilter === option.id ? 'border-rose-800 bg-rose-800 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50'}`}
              >
                {option.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${qualityFilter === option.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{option.count}</span>
              </button>
            ))}
            {(qualityFilter !== 'all' || searchQuery || categoryFilter !== 'All' || statusFilter !== 'All') && (
              <button type="button" className="px-2 py-2 text-xs font-semibold text-rose-800 hover:underline" onClick={() => { setQualityFilter('all'); setSearchQuery(''); setCategoryFilter('All'); setStatusFilter('All'); }}>Clear filters</button>
            )}
          </div>
          {visibleProducts.map(p => (
            <article className="flex flex-col items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between" key={p.id}>
              <div className="flex min-w-0 items-start gap-3">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-amber-50">
                  <ProductMedia url={mediaUrl(p)} productName={p.name} colour={p.colour} imageIndex={p.imageIndexes?.[0] ?? p.imageIndex} />
                </div>
                <div className="grid gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-slate-900">{p.name || 'Untitled product'}</b>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                    {photoCount(p) === 1 && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800">1 photo</span>}
                    {!p.priceOnRequest && !hasAnyPrice(p) && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">Price missing</span>}
                    {isLowStock(p) && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">Low stock · {Number(p.stock)} left</span>}
                    {p.status === 'active' && !p.stockOnRequest && Number(p.stock ?? 0) <= 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">Hidden — 0 stock</span>
                    )}
                  </div>
                  <span className="text-sm text-slate-500">{p.sku || 'no SKU'} · {p.category}</span>
                  <span className="text-sm text-slate-500">{p.priceOnRequest ? 'Price on request' : `₹${Number(p.price || 0).toLocaleString('en-IN')}`} · {photoCount(p)} photo(s){p.isStaticFallback ? ' · local catalogue' : ''}</span>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <label className="text-xs font-semibold text-slate-500">Price ₹</label>
                    <input type="number" min="1" step="1" inputMode="numeric" className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none focus:border-indigo-500" placeholder={p.priceOnRequest ? 'Set price' : String(p.price || '')} value={priceDrafts[p.id] ?? ''} onChange={e => setPriceDrafts(d => ({ ...d, [p.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); savePrice(p); } }} aria-label={`Set selling price for ${p.name}`} />
                    {priceDrafts[p.id] !== undefined && <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50" onClick={() => savePrice(p)} disabled={busy}><Save size={12} /> Save price</button>}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <label className="text-xs font-semibold text-slate-500">Stock</label>
                    <input
                      type="number" min="0" step="1"
                      className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none focus:border-indigo-500"
                      value={stockValue(p)}
                      onChange={e => setStockDraft(p.id, e.target.value)}
                    />
                    {stockDrafts[p.id] !== undefined && stockDrafts[p.id] !== String(p.stock ?? 0) && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                        onClick={() => saveStock(p)}
                      >
                        <Save size={12} /> Save
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Link className="dash-btn-ghost inline-flex items-center justify-center" to={"/admin/products/" + encodeURIComponent(p.id) + "/edit"}>Edit</Link>
                <button className="dash-btn-danger" onClick={() => remove(p)} aria-label={p.isFallbackProduct ? 'Hide fallback product' : 'Delete product'} title={p.isFallbackProduct ? 'Hide product so its fallback cannot reappear' : 'Delete product'}><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
          {!visibleProducts.length && !busy && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              {products.length ? 'No products match these filters. Clear the search or choose All categories/statuses.' : <>No products yet. <Link to="/admin/import" className="font-semibold text-indigo-600 hover:underline">Import photos</Link> or add one manually.</>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
