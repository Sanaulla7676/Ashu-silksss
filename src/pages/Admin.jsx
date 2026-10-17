import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, Plus, Trash2, RefreshCw, Save, Upload, X, ImagePlus, Sparkles, FolderTree, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminCatalogProducts, createCatalogProduct, updateCatalogProduct, deleteCatalogProduct } from '../services/catalog';
import { uploadProductImage, cloudinaryReady } from '../services/cloudinary';
import { firebaseReady } from '../firebase';
import { CATALOGUE_FIXES } from '../data/product-catalogue-fixes';
import { NEW_ARRIVALS } from '../data/new-arrivals';
import { PHOTO_UPDATES } from '../data/photo-updates';
import { useCategories } from '../context/CategoryContext';
import { mediaUrl, mediaUrls } from '../utils';
import ProductMedia from '../components/ProductMedia';

const empty = {
  name: '', brand: 'Ashu Silks', category: 'Kanjeevaram Silk', sku: '', status: 'active',
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

function markImportedPhotoUrls(urls) {
  if (!urls?.length) return;
  try {
    const old = JSON.parse(localStorage.getItem(IMPORT_USED_KEY) || '[]');
    localStorage.setItem(IMPORT_USED_KEY, JSON.stringify([...new Set([...old, ...urls])]));
  } catch { /* Product save succeeds even if this browser-only convenience marker fails. */ }
}

function readableAdminError(error) {
  const message = error?.message || 'An unexpected error occurred.';
  if (error?.code === 'permission-denied' || /missing or insufficient permissions|permission denied/i.test(message)) {
    return 'Firestore denied this action. Confirm the signed-in store-owner account has the Firebase custom claim admin=true, then sign out and sign in again. Keep the Firestore security rules restricted.';
  }
  return message;
}


function Section({ title, children }) {
  return (
    <div className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [editingFallback, setEditingFallback] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [stockDrafts, setStockDrafts] = useState({});
  const [priceDrafts, setPriceDrafts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [pendingImportUrls, setPendingImportUrls] = useState([]);

  const load = async () => {
    setBusy(true); setError('');
    try { setProducts(await getCatalogProducts()); }
    catch (e) { setError(readableAdminError(e)); }
    finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const incomingMedia = location.state?.media;
    const sourceUrls = location.state?.importSourceUrls;
    if (sourceUrls?.length) setPendingImportUrls(sourceUrls);
    if (incomingMedia?.length) {
      setEditing(null);
      setEditingFallback(false);
      setForm({ ...empty, media: incomingMedia.join('\n') });
      setPreview(incomingMedia[0]);
      toast.success(`${incomingMedia.length} photo(s) attached — review details and save the product`);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const set = (k, v) => setForm(x => ({ ...x, [k]: v }));

  const chooseFiles = async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true); setError('');
    try {
      const urls = [];
      for (const file of files) urls.push(await uploadProductImage(file, editing || 'new'));
      setForm(x => ({ ...x, media: [x.media, ...urls].filter(Boolean).join('\n') }));
      if (urls[0]) setPreview(urls[0]);
    } catch (e) { setError(readableAdminError(e)); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const save = async e => {
    e.preventDefault();
    setError('');
    const sellingPrice = Number(form.price || 0);
    const mrp = Number(form.mrp || sellingPrice);
    if (!form.priceOnRequest && (!Number.isFinite(sellingPrice) || sellingPrice <= 0)) {
      setError('Enter a selling price above ₹0, or turn on “Price on request”.');
      return;
    }
    if (!form.priceOnRequest && mrp > 0 && mrp < sellingPrice) {
      setError('MRP cannot be lower than the selling price.');
      return;
    }
    const stock = Number(form.stock || 0);
    const sku = String(form.sku || '').trim();
    if (!sku) {
      setError('A SKU is required. Use a unique product code so edits update the correct product.');
      return;
    }
    if (form.status === 'active' && !form.stockOnRequest && (!Number.isFinite(stock) || stock <= 0)) {
      setError('An active product needs a stock quantity above 0, or switch on “Availability on enquiry”. You can also keep it as a draft.');
      return;
    }
    const hasImage = form.media.split(/\r?\n/).some(url => url.trim())
      || (Array.isArray(form.imageIndexes) && form.imageIndexes.length > 0)
      || form.imageIndex !== undefined;
    if (form.status === 'active' && !hasImage) {
      setError('Add at least one product photo before publishing. Products without photos can be saved as drafts.');
      return;
    }
    const duplicate = products.find(product => String(product.sku || '').toLowerCase() === sku.toLowerCase() && product.id !== editing);
    if (duplicate) {
      setError(`SKU ${sku} is already used by “${duplicate.name}”. Each product needs a unique SKU.`);
      return;
    }

    setBusy(true);
    try {
      const media = form.media.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      const videoUrl = String(form.video || '').trim();
      if (videoUrl && !media.includes(videoUrl)) media.push(videoUrl);
      const highlights = form.highlights.split('\n').map(x => x.trim()).filter(Boolean);
      const tags = form.tags.split(',').map(x => x.trim()).filter(Boolean);
      const data = {
        ...persistableProduct(form), media, highlights, tags,
        sku: String(form.sku).trim(),
        price: sellingPrice, mrp,
        priceOnRequest: Boolean(form.priceOnRequest),
        gstPercent: Number(form.gstPercent || 0), stock: Number(form.stock),
        weight: Number(form.weight || 0), featured: Boolean(form.featured),
      };
      if (editing && editingFallback) await createCatalogProduct(data);
      else if (editing) await updateCatalogProduct(editing, data);
      else await createCatalogProduct(data);
      markImportedPhotoUrls(pendingImportUrls);
      setPendingImportUrls([]);
      toast.success(editing ? 'Product saved to the live catalogue' : 'Product added to the live catalogue');
      setForm(empty); setEditing(null); setEditingFallback(false); setPreview('');
      await load();
    } catch (e) { setError(readableAdminError(e)); }
    finally { setBusy(false); }
  };

  const edit = p => {
    setEditing(p.id);
    setEditingFallback(Boolean(p.isStaticFallback));
    const media = mediaUrls(p).join('\n');
    const highlights = Array.isArray(p.highlights) ? p.highlights.join('\n') : (p.highlights || '');
    const tags = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');
    setForm({
      ...empty, ...p, media, highlights, tags,
      price: String(p.price ?? ''), mrp: String(p.mrp ?? ''), stock: String(p.stock ?? '0'),
      gstPercent: String(p.gstPercent ?? '5'), weight: String(p.weight ?? ''),
    });
    setPreview(mediaUrl(p));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const clear = () => { setEditing(null); setEditingFallback(false); setForm(empty); setPreview(''); setPendingImportUrls([]); };

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
  const photoCount = p => mediaUrls(p).length || (Array.isArray(p.imageIndexes) ? p.imageIndexes.length : (p.imageIndex !== undefined ? 1 : 0));
  // Publish only products that have a usable image and explicit price/availability settings.
  const readyDrafts = draftProducts.filter(p =>
    photoCount(p) > 0 && (p.priceOnRequest || Number(p.price) > 0) && (p.stockOnRequest || Number(p.stock ?? 0) > 0),
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

  const formMediaUrls = form.media.split(/\r?\n/).map(url => url.trim()).filter(Boolean);
  const removeFormMedia = url => {
    const next = formMediaUrls.filter(item => item !== url);
    set('media', next.join('\n'));
    if (preview === url) setPreview(next[0] || '');
  };

  const visibleProducts = products.filter(product => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || [product.name, product.sku, product.category, product.colour]
      .some(value => String(value || '').toLowerCase().includes(q));
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || (product.status || 'active') === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stockValue = p => stockDrafts[p.id] ?? String(p.stock ?? 0);
  const setStockDraft = (id, v) => setStockDrafts(d => ({ ...d, [id]: v }));
  const saveStock = async p => {
    const value = Number(stockDrafts[p.id]);
    if (Number.isNaN(value) || value < 0) { toast.error('Enter a valid stock number'); return; }
    try {
      await saveCatalogFields(p, { stock: value, stockOnRequest: false });
      toast.success(`${p.name || 'Product'} stock updated`);
      setStockDrafts(d => { const next = { ...d }; delete next[p.id]; return next; });
      await load();
    } catch (e) { toast.error(e.message); }
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
        <button className="dash-btn-ghost" onClick={load} disabled={busy}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">{error}</div>}

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
        <form className="dash-card grid gap-5 p-5" onSubmit={save}>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Package size={18} /> {editing ? 'Edit product' : 'Add product'}</h2>
            {form.status === 'draft' && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">Draft — not visible on site</span>}
          </div>

          <Section title="Basic info">
            <input className="dash-field" required placeholder="Product title" value={form.name} onChange={e => set('name', e.target.value)} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="dash-field" placeholder="Brand" value={form.brand} onChange={e => set('brand', e.target.value)} />
              <select className="dash-field" required value={form.category} onChange={e => set('category', e.target.value)}>
                {/* Keep a product's own category selectable even if it was removed
                    from the list, so editing never silently reassigns it. */}
                {(categories.includes(form.category) ? categories : [form.category, ...categories])
                  .filter(Boolean)
                  .map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="dash-field" required placeholder="SKU" value={form.sku} onChange={e => set('sku', e.target.value)} />
              <select className="dash-field" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">Draft (hidden)</option>
                <option value="active">Active (public)</option>
              </select>
            </div>
          </Section>

          <Section title="Pricing, tax & stock">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="dash-field" required={!form.priceOnRequest} type="number" min={form.priceOnRequest ? '0' : '1'} step="1" placeholder="Selling price (₹)" value={form.price} onChange={e => set('price', e.target.value)} />
              <input className="dash-field" type="number" min="0" step="1" placeholder="MRP (₹)" value={form.mrp} onChange={e => set('mrp', e.target.value)} />
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <input type="checkbox" checked={Boolean(form.priceOnRequest)} onChange={e => set('priceOnRequest', e.target.checked)} className="mt-1 h-4 w-4 accent-indigo-600" />
              <span>
                <span className="block text-sm font-semibold text-slate-800">Display “Price on request”</span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-500">Turn this off after entering a confirmed selling price. This controls the price shown to customers.</span>
              </span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="dash-field" type="number" min="0" step="0.1" placeholder="GST %" value={form.gstPercent} onChange={e => set('gstPercent', e.target.value)} />
              <input className="dash-field" required type="number" min="0" step="1" placeholder="Stock quantity" value={form.stock} onChange={e => set('stock', e.target.value)} />
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <input
                type="checkbox"
                checked={Boolean(form.stockOnRequest)}
                onChange={e => set('stockOnRequest', e.target.checked)}
                className="mt-1 h-4 w-4 accent-indigo-600"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">Availability on enquiry</span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-500">Use when the exact available quantity is not confirmed. The product can be listed without displaying a made-up stock count.</span>
              </span>
            </label>
          </Section>

          <Section title="Saree details">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="dash-field" placeholder="Colour" value={form.colour} onChange={e => set('colour', e.target.value)} />
              <input className="dash-field" placeholder="Fabric" value={form.fabric} onChange={e => set('fabric', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select className="dash-field" value={form.pattern} onChange={e => set('pattern', e.target.value)}>
                <option value="">Pattern...</option>
                {patternOptions.map(p => <option key={p}>{p}</option>)}
              </select>
              <input className="dash-field" placeholder="Occasion" value={form.occasion} onChange={e => set('occasion', e.target.value)} />
            </div>
            <input className="dash-field" placeholder="Ornamentation / work (e.g. Zari, Hand embroidery)" value={form.workType} onChange={e => set('workType', e.target.value)} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select className="dash-field" value={form.blousePiece} onChange={e => set('blousePiece', e.target.value)}>
                {blouseOptions.map(b => <option key={b}>{b}</option>)}
              </select>
              <input className="dash-field" placeholder="Saree length" value={form.sareeLength} onChange={e => set('sareeLength', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="dash-field" placeholder="Wash care" value={form.washCare} onChange={e => set('washCare', e.target.value)} />
              <input className="dash-field" placeholder="Country of origin" value={form.countryOfOrigin} onChange={e => set('countryOfOrigin', e.target.value)} />
            </div>
            <input className="dash-field" type="number" min="0" placeholder="Weight (grams)" value={form.weight} onChange={e => set('weight', e.target.value)} />
          </Section>

          <Section title="Description & search">
            <textarea className="dash-field min-h-24" placeholder="Full description" value={form.description} onChange={e => set('description', e.target.value)} />
            <textarea className="dash-field min-h-20" placeholder="Highlights — one per line (e.g. Pure Kanjeevaram silk, Contrast zari border)" value={form.highlights} onChange={e => set('highlights', e.target.value)} />
            <input className="dash-field" placeholder="Search tags, comma separated" value={form.tags} onChange={e => set('tags', e.target.value)} />
          </Section>

          <Section title="Images & video">
            {!cloudinaryReady && (
              <p className="text-sm font-semibold text-red-600">Cloudinary is not configured — paste image URLs directly below.</p>
            )}
            <label className={`dash-btn-ghost inline-flex ${cloudinaryReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
              <Upload size={16} />{uploading ? 'Uploading...' : 'Choose images'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={chooseFiles} disabled={uploading || !cloudinaryReady} />
            </label>
            {formMediaUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {formMediaUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative aspect-[3/4] overflow-hidden rounded-lg border border-slate-200 bg-amber-50">
                    <ProductMedia url={url} productName={`${form.name || 'Product'} photo ${index + 1}`} colour={form.colour} imageIndex={form.imageIndexes?.[index] ?? form.imageIndex} />
                    <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">{index + 1}</span>
                    <button type="button" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-slate-800 shadow-sm hover:bg-red-50 hover:text-red-600" aria-label={`Remove product photo ${index + 1}`} onClick={() => removeFormMedia(url)}><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
            {!formMediaUrls.length && editing && form.imageIndexes?.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {form.imageIndexes.map((imageIndex, index) => <div key={imageIndex} className="aspect-[3/4] overflow-hidden rounded-lg border border-slate-200"><ProductMedia url="" productName={form.name} colour={form.colour} imageIndex={imageIndex} /><span className="sr-only">Fallback photo {index + 1}</span></div>)}
              </div>
            )}
            <p className="text-xs text-slate-500">Upload several angles, review the thumbnail order, and remove any incorrect photo before saving.</p>
            <textarea className="dash-field min-h-20" placeholder="Image URLs, one per line" value={form.media} onChange={e => { set('media', e.target.value); setPreview(e.target.value.split(/\r?\n/).map(url => url.trim()).find(Boolean) || ''); }} />
            <input className="dash-field" placeholder="Video URL (optional)" value={form.video} onChange={e => set('video', e.target.value)} />
          </Section>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={!!form.featured} onChange={e => set('featured', e.target.checked)} /> Featured on homepage
          </label>

          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="dash-btn-ghost" onClick={clear}><X size={16} /> Clear</button>
            <button className="dash-btn-primary" disabled={busy || uploading || !firebaseReady}>
              {editing ? <Save size={16} /> : <Plus size={16} />} {editing ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </form>

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
              <input className="min-w-0 flex-1 py-2 text-sm outline-none" placeholder="Search name, SKU or colour" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </label>
            <select className="dash-field" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} aria-label="Filter by category">
              <option value="All">All categories</option>
              {[...new Set([...categories, ...products.map(p => p.category).filter(Boolean)])].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="dash-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
              <option value="All">All statuses</option><option value="active">Active</option><option value="draft">Draft</option>
            </select>
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
                <button className="dash-btn-ghost" onClick={() => edit(p)}>Edit</button>
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
