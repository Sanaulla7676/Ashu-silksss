import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileClock, LoaderCircle, RefreshCw, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductMedia from '../components/ProductMedia';
import { firebaseReady } from '../firebase';
import { createCatalogProduct, getAdminCatalogProducts, updateCatalogProduct } from '../services/catalog';
import { isVideoMedia, mediaUrls, productPhotoCount } from '../utils';

function missingForDraft(product) {
  const missing = [];
  if (!String(product.name || '').trim()) missing.push('Product name');
  if (!String(product.sku || '').trim()) missing.push('SKU');
  if (!String(product.category || '').trim()) missing.push('Category');
  if (!product.priceOnRequest && Number(product.price || 0) <= 0) missing.push('Selling price');
  if (!product.stockOnRequest && Number(product.stock || 0) <= 0) missing.push('Stock');
  if (productPhotoCount(product) < 3) missing.push('3 genuine photos');
  return missing;
}

function savedDate(value) {
  const date = value?.toDate?.()
    || (value?.seconds ? new Date(value.seconds * 1000) : value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
    : 'Date unavailable';
}

function publishDraft(product) {
  if (product.isStaticFallback) {
    const payload = { ...product, status: 'active' };
    delete payload.id;
    delete payload.isStaticFallback;
    delete payload.isFallbackProduct;
    return createCatalogProduct(payload);
  }
  return updateCatalogProduct(product.id, { status: 'active' });
}

export default function AdminDrafts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const items = await getAdminCatalogProducts();
      setProducts(items.filter(product => String(product.status || 'active').toLowerCase() === 'draft'));
    } catch (err) {
      setError(err?.message || 'Draft products could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const enriched = useMemo(() => products.map(product => ({
    ...product,
    missing: missingForDraft(product),
    photoCount: productPhotoCount(product),
  })).sort((a, b) => {
    const stamp = value => value?.seconds ? value.seconds * 1000 : value ? new Date(value).getTime() || 0 : 0;
    return stamp(b.updatedAt || b.createdAt) - stamp(a.updatedAt || a.createdAt);
  }), [products]);

  const ready = enriched.filter(product => product.missing.length === 0);
  const visible = enriched.filter(product => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [product.name, product.sku, product.category]
      .some(value => String(value || '').toLowerCase().includes(term));
    const matchesFilter = filter === 'all'
      || (filter === 'ready' ? product.missing.length === 0 : product.missing.length > 0);
    return matchesSearch && matchesFilter;
  });

  const publishOne = async product => {
    if (product.missing.length) {
      toast.error('Complete these items first: ' + product.missing.join(', ') + '.');
      return;
    }
    if (!window.confirm('Publish "' + (product.name || 'this product') + '" to the live storefront?')) return;
    setBusyId(product.id);
    try {
      await publishDraft(product);
      toast.success((product.name || 'Product') + ' published.');
      await load();
    } catch (err) {
      toast.error(err?.message || 'This draft could not be published.');
    } finally {
      setBusyId('');
    }
  };

  const publishReady = async () => {
    if (!ready.length || bulkBusy) return;
    if (!window.confirm('Publish all ' + ready.length + ' ready draft product(s)? Products needing details will stay as drafts.')) return;
    setBulkBusy(true);
    let done = 0;
    try {
      for (const product of ready) {
        await publishDraft(product);
        done += 1;
      }
      toast.success(done + ' draft product(s) published.');
      await load();
    } catch (err) {
      setError('Published ' + done + ' product(s), then stopped: ' + (err?.message || 'Unknown error.'));
      await load();
    } finally {
      setBulkBusy(false);
    }
  };

  return <section>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Product drafts</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Every saved draft stays here under its product name. Continue editing, see what is missing, and publish only when the listing is ready.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/admin/products/new" className="dash-btn-primary">Add product</Link>
        <button type="button" className="dash-btn-ghost" onClick={load} disabled={loading || bulkBusy}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>
    </div>

    {!firebaseReady && <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Firebase is not configured. Drafts cannot be loaded or saved.</div>}
    {error && <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}

    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <div className="dash-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total drafts</p><p className="mt-1 text-2xl font-bold text-slate-900">{enriched.length}</p></div>
      <div className="dash-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready to publish</p><p className="mt-1 text-2xl font-bold text-emerald-700">{ready.length}</p></div>
      <div className="dash-card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Need attention</p><p className="mt-1 text-2xl font-bold text-amber-700">{enriched.length - ready.length}</p></div>
    </div>

    <div className="dash-card mb-5 grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_190px_auto]">
      <label className="relative block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="dash-field pl-10" placeholder="Search draft name, SKU or category…" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <select className="dash-field" value={filter} onChange={event => setFilter(event.target.value)} aria-label="Filter drafts"><option value="all">All drafts</option><option value="ready">Ready to publish</option><option value="needs">Needs attention</option></select>
      <button type="button" className="dash-btn-primary" onClick={publishReady} disabled={bulkBusy || loading || !ready.length || !firebaseReady}>{bulkBusy ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Publish {ready.length} ready</button>
    </div>

    {loading ? <div className="dash-card p-10 text-center"><LoaderCircle size={24} className="mx-auto animate-spin text-rose-700" /><p className="mt-2 text-sm text-slate-500">Loading saved drafts…</p></div>
      : visible.length ? <div className="grid gap-3">
        {visible.map(product => {
          const cover = mediaUrls(product).find(url => !isVideoMedia(url)) || '';
          return <article key={product.id} className="dash-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-rose-50"><ProductMedia url={cover} productName={product.name || 'Draft product'} imageIndex={product.imageIndexes?.[0] ?? product.imageIndex} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{product.name || 'Untitled product'}</h2><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">Draft</span>{product.missing.length === 0 && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">Ready</span>}</div>
              <p className="mt-1 text-xs text-slate-500">{product.sku || 'No SKU'} · {product.category || 'No category'} · Last saved {savedDate(product.updatedAt || product.createdAt)}</p>
              <p className="mt-1 text-sm text-slate-600">{product.photoCount} photo view(s) · {product.priceOnRequest ? 'Price on request' : Number(product.price) > 0 ? '₹' + Number(product.price).toLocaleString('en-IN') : 'Price missing'}</p>
              {product.missing.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{product.missing.map(item => <span key={item} className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900">Needs {item}</span>)}</div>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link to={'/admin/products/' + encodeURIComponent(product.id) + '/edit'} className="dash-btn-ghost">Continue editing</Link>
              <button type="button" className="dash-btn-primary" onClick={() => publishOne(product)} disabled={bulkBusy || busyId === product.id || product.missing.length > 0 || !firebaseReady}>{busyId === product.id ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Publish</button>
            </div>
          </article>;
        })}
      </div>
      : <div className="dash-card p-10 text-center"><FileClock size={28} className="mx-auto mb-3 text-slate-300" /><p className="font-semibold text-slate-800">{enriched.length ? 'No drafts match this search' : 'No saved drafts yet'}</p><p className="mt-1 text-sm text-slate-500">{enriched.length ? 'Clear the search or change the filter.' : 'When you save a product as a draft, it will appear here under its product name.'}</p></div>}
  </section>;
}
