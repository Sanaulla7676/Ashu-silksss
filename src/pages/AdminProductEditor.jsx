import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, ChevronDown, ImagePlus, LoaderCircle, Package, Save, Sparkles, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCategories } from '../context/CategoryContext';
import { firebaseReady } from '../firebase';
import ProductMedia from '../components/ProductMedia';
import { createCatalogProduct, getAdminCatalogProducts, updateCatalogProduct } from '../services/catalog';
import { cloudinaryReady, uploadProductImage } from '../services/cloudinary';
import { isVideoMedia, mediaUrls, productPhotoCount } from '../utils';

const EMPTY = {
  name: '', brand: 'Ashu Silks', category: 'Kanjeevaram Silk', sku: '', status: 'draft',
  price: '', mrp: '', priceOnRequest: false, gstPercent: '5', stock: '', stockOnRequest: false,
  colour: '', fabric: '', pattern: '', occasion: '', workType: '', blousePiece: 'Included',
  sareeLength: '6.3 metres with blouse piece', washCare: 'Dry clean only', countryOfOrigin: 'India',
  weight: '', description: '', highlights: '', tags: '', media: '', video: '', featured: false, imageIndexes: [],
};
const PATTERNS = ['Checked', 'Striped', 'Zari Woven', 'Floral', 'Solid', 'Printed', 'Embroidered', 'Temple Border'];
const BLOUSE = ['Included', 'Not included', 'Running blouse fabric'];
const IMPORT_KEY = 'ashu_import_used_urls';

const lines = value => [...new Set(String(value || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean))];

function toForm(product) {
  const urls = mediaUrls(product);
  return {
    ...EMPTY, ...product,
    status: product.status || 'active',
    media: urls.filter(url => !isVideoMedia(url)).join('\n'),
    video: String(product.video || urls.find(isVideoMedia) || ''),
    highlights: Array.isArray(product.highlights) ? product.highlights.join('\n') : String(product.highlights || ''),
    tags: Array.isArray(product.tags) ? product.tags.join(', ') : String(product.tags || ''),
    price: String(product.price ?? ''), mrp: String(product.mrp ?? ''),
    stock: String(product.stock ?? '0'), gstPercent: String(product.gstPercent ?? '5'),
    weight: String(product.weight ?? ''),
    imageIndexes: Array.isArray(product.imageIndexes) ? product.imageIndexes : [],
  };
}

function uniqueSku(name, products) {
  const base = 'AS-' + (String(name || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 18) || 'SAREE');
  const taken = new Set(products.map(item => String(item.sku || '').toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  let n = 2;
  while (taken.has((base + '-' + String(n).padStart(2, '0')).toLowerCase())) n += 1;
  return base + '-' + String(n).padStart(2, '0');
}

function Field({ label, hint, required, children }) {
  return <label className="block min-w-0">
    <span className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-slate-700">{label}{required && <span className="text-rose-700" aria-hidden="true">*</span>}</span>
    {children}
    {hint && <span className="mt-1 block text-xs leading-5 text-slate-500">{hint}</span>}
  </label>;
}

function errorText(error) {
  const message = error?.message || 'An unexpected error occurred.';
  if (error?.code === 'permission-denied' || /missing or insufficient permissions|permission denied/i.test(message)) {
    return 'Firebase denied this action. Confirm the store-owner account has the admin=true custom claim, then sign out and sign in again.';
  }
  return message;
}

function markImported(urls) {
  if (!urls?.length) return;
  try {
    const previous = JSON.parse(localStorage.getItem(IMPORT_KEY) || '[]');
    localStorage.setItem(IMPORT_KEY, JSON.stringify([...new Set([...previous, ...urls])]));
  } catch { /* Import tracking is a convenience; product saving must still succeed. */ }
}

export default function AdminProductEditor() {
  const { id: productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { categories, saveCategories } = useCategories();
  const picker = useRef(null);
  const imported = useRef(Array.isArray(location.state?.importSourceUrls) ? location.state.importSourceUrls : []);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [form, setForm] = useState(() => ({ ...EMPTY, media: Array.isArray(location.state?.media) ? location.state.media.join('\n') : '' }));
  const [snapshot, setSnapshot] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [original, setOriginal] = useState(null);
  const [advanced, setAdvanced] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let active = true;
    getAdminCatalogProducts().then(items => { if (active) setProducts(items); })
      .catch(err => { if (active) setLoadError(errorText(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (loading || initialized || (loadError && productId)) return;
    if (productId) {
      const found = products.find(item => String(item.id) === String(productId));
      if (!found) {
        setError('This product was not found in the current catalogue. Return to Products and open the listing again.');
        return;
      }
      const next = toForm(found);
      setForm(next); setOriginal(found); setIsFallback(Boolean(found.isStaticFallback));
      setSnapshot(JSON.stringify(next)); setInitialized(true);
      setAdvanced(Boolean(next.fabric || next.pattern || next.workType || next.highlights || next.tags));
    } else {
      const next = { ...EMPTY, media: Array.isArray(location.state?.media) ? location.state.media.join('\n') : '' };
      setForm(next); setSnapshot(JSON.stringify(next)); setInitialized(true);
      if (location.state?.media?.length) toast.success(location.state.media.length + ' photo(s) attached. Add the details and save.');
      if (location.state) navigate(location.pathname, { replace: true, state: null });
    }
  }, [loading, initialized, loadError, productId, products, location.state, location.pathname, navigate]);

  const patch = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const addCategory = async () => {
    const name = newCategory.trim().replace(/\\s+/g, ' ');
    if (!name) return setError('Enter a category name first.');
    if (name.length > 60) return setError('Category names must be 60 characters or fewer.');
    if (categories.some(category => category.toLowerCase() === name.toLowerCase())) {
      patch('category', categories.find(category => category.toLowerCase() === name.toLowerCase()));
      setNewCategory('');
      setShowNewCategory(false);
      toast('That category already exists, so I selected it.');
      return;
    }
    setCategoryBusy(true); setError('');
    try {
      await saveCategories([...categories, name]);
      patch('category', name);
      setNewCategory('');
      setShowNewCategory(false);
      toast.success('Category created and selected.');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setCategoryBusy(false);
    }
  };
  const guardUnsavedNavigation = event => {
    if (dirty && !window.confirm('Discard your unsaved product changes?')) event.preventDefault();
  };
  const leaveEditor = () => {
    if (dirty && !window.confirm('Discard your unsaved product changes?')) return;
    navigate('/admin/products');
  };
  const media = useMemo(() => lines(form.media), [form.media]);
  const images = useMemo(() => media.filter(url => !isVideoMedia(url)), [media]);
  const photoCount = productPhotoCount({ ...form, media });
  const dirty = initialized && JSON.stringify(form) !== snapshot;
  const cover = images[0] || '';
  const categoryOptions = [...new Set([form.category, ...(categories || [])].filter(Boolean))];
  const canPublish = Boolean(form.name.trim() && form.sku.trim())
    && (form.priceOnRequest || Number(form.price) > 0)
    && (form.stockOnRequest || Number(form.stock) > 0)
    && photoCount >= 3;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const uploadFiles = async inputFiles => {
    const files = Array.from(inputFiles || []);
    if (!files.length) return;
    if (!cloudinaryReady) { setError('Cloudinary is not configured. Paste image URLs in More product details or restore the Cloudinary settings.'); return; }
    setError(''); setUploading(true); setUploadProgress({ done: 0, total: files.length });
    let done = 0;
    try {
      for (const file of files) {
        const url = await uploadProductImage(file, productId || 'new');
        setForm(prev => ({ ...prev, media: lines(String(prev.media || '') + '\n' + url).join('\n') }));
        done += 1; setUploadProgress({ done, total: files.length });
      }
      toast.success(done + ' image' + (done === 1 ? '' : 's') + ' added.');
    } catch (err) {
      setError((done ? done + ' image(s) uploaded successfully. ' : '') + errorText(err));
    } finally {
      setUploading(false); setUploadProgress({ done: 0, total: 0 });
      if (picker.current) picker.current.value = '';
    }
  };

  const removeMedia = url => {
    patch('media', media.filter(item => item !== url).join('\n'));
  };

  const moveMedia = (url, direction) => {
    const next = [...media];
    const index = next.indexOf(url);
    if (index < 0 || index + direction < 0 || index + direction >= next.length) return;
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    patch('media', next.join('\n'));
  };

  const save = async status => {
    setError('');
    const name = String(form.name || '').trim();
    const sku = String(form.sku || '').trim();
    const price = Number(form.price || 0);
    const mrp = Number(form.mrp || price);
    const stock = Number(form.stock || 0);
    if (!name) return setError('Add a product name before saving.');
    if (!sku) return setError('Add a unique SKU or select Generate SKU.');
    if (!String(form.category || '').trim()) return setError('Choose a product category.');
    if (!Number.isFinite(price) || price < 0) return setError('Enter a valid selling price.');
    if (!Number.isInteger(stock) || !Number.isFinite(stock) || stock < 0) return setError('Stock must be a whole number of zero or more.');
    if (status === 'active' && !form.priceOnRequest && price <= 0) return setError('Enter a selling price above ₹0, or select Price on request.');
    if (status === 'active' && !form.priceOnRequest && mrp > 0 && mrp < price) return setError('MRP cannot be lower than the selling price.');
    if (status === 'active' && !form.stockOnRequest && stock <= 0) return setError('Active products need stock above zero or Availability on enquiry enabled.');
    if (status === 'active' && photoCount < 3) return setError('Add at least 3 genuine photo views before publishing. Current count: ' + photoCount + '.');
    const duplicate = products.find(item => String(item.sku || '').trim().toLowerCase() === sku.toLowerCase() && String(item.id) !== String(productId || ''));
    if (duplicate) return setError('SKU ' + sku + ' is already used by "' + (duplicate.name || 'another product') + '".');
    if (status === 'active' && !window.confirm(original?.status === 'active' ? 'Publish these changes to the live storefront now?' : 'Publish this product to the live storefront now?')) return;
    if (status === 'draft' && original?.status === 'active' && !window.confirm('Saving as a draft will hide this product until you publish it again. Continue?')) return;

    setBusy(true);
    try {
      const allMedia = [...media];
      const video = String(form.video || '').trim();
      if (video && !allMedia.includes(video)) allMedia.push(video);
      const tags = [...new Set(String(form.tags || '').split(',').map(item => item.trim()).filter(Boolean))];
      const data = {
        ...form, name, sku, status, media: allMedia, video,
        brand: String(form.brand || 'Ashu Silks').trim(),
        category: String(form.category || '').trim(),
        highlights: lines(form.highlights), tags,
        price, mrp: mrp || price,
        priceOnRequest: Boolean(form.priceOnRequest),
        gstPercent: Number(form.gstPercent || 0),
        stock, stockOnRequest: Boolean(form.stockOnRequest),
        weight: Number(form.weight || 0), featured: Boolean(form.featured),
      };
      delete data.id; delete data.isStaticFallback; delete data.isFallbackProduct;
      delete data.createdAt; delete data.updatedAt; delete data.imagePending;
      if (productId && !isFallback) await updateCatalogProduct(productId, data);
      else await createCatalogProduct(data);
      markImported(imported.current);
      toast.success(status === 'active' ? 'Product published successfully.' : 'Product saved as a draft.');
      navigate('/admin/products', { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally { setBusy(false); }
  };

  const shownPrice = form.priceOnRequest ? 'Price on request'
    : Number(form.price) > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(form.price))
      : 'Price to be added';

  if (loading) return <div className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center"><LoaderCircle size={28} className="animate-spin text-rose-700" /><p className="mt-3 text-sm text-slate-500">Loading product catalogue…</p></div>;
  if (loadError && productId) return <div className="rounded-2xl border border-rose-200 bg-white p-6"><p className="font-semibold text-rose-800">{loadError}</p><Link className="dash-btn-primary mt-4 inline-flex" to="/admin/products">Back to Products</Link></div>;

  return <div className="mx-auto max-w-[1440px] pb-24">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <Link to="/admin/products" onClick={guardUnsavedNavigation} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-800"><ArrowLeft size={16} /> Back to Products</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">{productId ? 'Edit product' : 'Add a product'}</h1>
          <span className={'rounded-full px-3 py-1 text-xs font-bold ' + (form.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>{form.status === 'active' ? 'Live on storefront' : 'Draft · not visible'}</span>
        </div>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Add details and real photos in one place. Save a draft first, or publish when pricing, stock and photos are ready.</p>
      </div>
      <Link to="/admin/import" onClick={guardUnsavedNavigation} className="dash-btn-ghost inline-flex items-center gap-2"><ImagePlus size={16} /> Choose from photo library</Link>
    </div>

    {(error || loadError) && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">{error || loadError}</div>}
    {!firebaseReady && <div role="alert" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Firebase is not configured. Product changes cannot be saved yet.</div>}

    <form onSubmit={event => { event.preventDefault(); save(form.status === 'active' ? 'active' : 'draft'); }} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
      <div className="grid gap-5">
        <section className="dash-card p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Package size={19} className="text-rose-700" /> Product basics</h2><p className="mt-1 text-sm text-slate-500">Name, category and description.</p></div>
            {dirty && <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Unsaved changes</span>}
          </div>
          <div className="grid gap-4">
            <Field label="Product name" required hint="Make the name specific enough for customers to distinguish this item.">
              <input className="dash-field" autoFocus={!productId} required maxLength={120} placeholder="e.g. Maroon Kanjeevaram Silk Saree" value={form.name} onChange={event => patch('name', event.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Field label="Product category" required hint="Choose where shoppers will find this product. New categories can be created here.">
                    <select className="dash-field" value={form.category} onChange={event => patch('category', event.target.value)} required>
                      {categoryOptions.map(category => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </Field>
                  <button type="button" className="dash-btn-ghost inline-flex items-center justify-center gap-1.5" onClick={() => setShowNewCategory(open => !open)} disabled={categoryBusy}>
                    <Package size={15} /> {showNewCategory ? 'Cancel' : 'New category'}
                  </button>
                </div>
                {showNewCategory && (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                    <p className="text-sm font-semibold text-slate-800">Create a category</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">It is saved to the store category list and selected for this product.</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input className="dash-field min-w-0 flex-1" maxLength={60} autoComplete="off" placeholder="e.g. Banarasi Silk" value={newCategory} onChange={event => setNewCategory(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCategory(); } }} />
                      <button type="button" className="dash-btn-primary inline-flex shrink-0 items-center justify-center gap-1.5" onClick={addCategory} disabled={categoryBusy || !newCategory.trim()}>
                        {categoryBusy ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} {categoryBusy ? 'Saving…' : 'Create & select'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <Field label="SKU / product code" required hint="Generate a unique SKU to avoid typing one manually.">
                <div className="flex gap-2"><input className="dash-field min-w-0 flex-1" maxLength={64} placeholder="AS-KANJEEVARAM-01" value={form.sku} onChange={event => patch('sku', event.target.value)} required /><button type="button" className="dash-btn-ghost shrink-0 !px-3" onClick={() => patch('sku', uniqueSku(form.name, products))} title="Generate a unique SKU"><Sparkles size={15} /><span className="hidden sm:inline">Generate</span></button></div>
              </Field>
            </div>
            <Field label="Product description" hint="Mention the fabric, design, finish, included blouse piece, and care details you can verify.">
              <textarea className="dash-field min-h-28" maxLength={5000} placeholder="Write a specific description that answers customer questions…" value={form.description} onChange={event => patch('description', event.target.value)} />
            </Field>
          </div>
        </section>

        <section className="dash-card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Price & stock</h2><p className="mb-4 mt-1 text-sm text-slate-500">Enter the actual selling price and current availability shown to customers.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Selling price (₹)" required={!form.priceOnRequest} hint="Excludes the checkout shipping charge."><input className="dash-field" type="number" min="0" step="1" inputMode="numeric" placeholder="e.g. 12999" value={form.price} onChange={event => patch('price', event.target.value)} required={!form.priceOnRequest} /></Field>
            <Field label="MRP (₹)" hint="Optional. Only enter a genuine MRP."><input className="dash-field" type="number" min="0" step="1" inputMode="numeric" placeholder="e.g. 15999" value={form.mrp} onChange={event => patch('mrp', event.target.value)} /></Field>
            <Field label="Available quantity" required hint="Use a whole number. Do not guess stock."><input className="dash-field" type="number" min="0" step="1" inputMode="numeric" placeholder="e.g. 4" value={form.stock} onChange={event => patch('stock', event.target.value)} /></Field>
            <Field label="GST (%)" hint="Confirm the correct product rate with your accountant."><input className="dash-field" type="number" min="0" max="100" step="0.1" inputMode="decimal" value={form.gstPercent} onChange={event => patch('gstPercent', event.target.value)} /></Field>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5"><input type="checkbox" checked={Boolean(form.priceOnRequest)} onChange={event => patch('priceOnRequest', event.target.checked)} className="mt-1 h-4 w-4 accent-rose-700" /><span><b className="block text-sm text-slate-800">Price on request</b><span className="mt-0.5 block text-xs leading-5 text-slate-500">Show an enquiry action instead of a price.</span></span></label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5"><input type="checkbox" checked={Boolean(form.stockOnRequest)} onChange={event => patch('stockOnRequest', event.target.checked)} className="mt-1 h-4 w-4 accent-rose-700" /><span><b className="block text-sm text-slate-800">Availability on enquiry</b><span className="mt-0.5 block text-xs leading-5 text-slate-500">Use if the exact quantity is not confirmed.</span></span></label>
          </div>
        </section>

        <details open={advanced} onToggle={event => setAdvanced(event.currentTarget.open)} className="dash-card p-5 sm:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3"><span><b className="block text-lg text-slate-900">More product details</b><span className="mt-1 block text-sm text-slate-500">Optional fabric attributes, care, highlights and search tags.</span></span><ChevronDown size={19} className="shrink-0 text-slate-500" /></summary>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Colour"><input className="dash-field" maxLength={80} placeholder="Wine red with gold zari" value={form.colour} onChange={event => patch('colour', event.target.value)} /></Field>
            <Field label="Fabric / material"><input className="dash-field" maxLength={100} placeholder="e.g. Kanjeevaram silk" value={form.fabric} onChange={event => patch('fabric', event.target.value)} /></Field>
            <Field label="Pattern"><select className="dash-field" value={form.pattern} onChange={event => patch('pattern', event.target.value)}><option value="">Choose pattern</option>{PATTERNS.map(item => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Occasion"><input className="dash-field" maxLength={100} placeholder="Wedding, festive, daily wear…" value={form.occasion} onChange={event => patch('occasion', event.target.value)} /></Field>
            <Field label="Work / ornamentation"><input className="dash-field" maxLength={120} placeholder="Zari border, hand embroidery…" value={form.workType} onChange={event => patch('workType', event.target.value)} /></Field>
            <Field label="Blouse piece"><select className="dash-field" value={form.blousePiece} onChange={event => patch('blousePiece', event.target.value)}>{BLOUSE.map(item => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Saree length"><input className="dash-field" maxLength={120} value={form.sareeLength} onChange={event => patch('sareeLength', event.target.value)} /></Field>
            <Field label="Weight (grams)"><input className="dash-field" type="number" min="0" step="1" value={form.weight} onChange={event => patch('weight', event.target.value)} /></Field>
            <Field label="Wash care"><input className="dash-field" maxLength={160} value={form.washCare} onChange={event => patch('washCare', event.target.value)} /></Field>
            <Field label="Country of origin"><input className="dash-field" maxLength={80} value={form.countryOfOrigin} onChange={event => patch('countryOfOrigin', event.target.value)} /></Field>
            <Field label="Highlights" hint="One point per line."><textarea className="dash-field min-h-24" placeholder={'Contrast border\nBlouse piece included'} value={form.highlights} onChange={event => patch('highlights', event.target.value)} /></Field>
            <Field label="Search tags" hint="Separate with commas."><input className="dash-field" placeholder="bridal, zari, traditional" value={form.tags} onChange={event => patch('tags', event.target.value)} /></Field>
            <div className="sm:col-span-2"><Field label="Product video URL (optional)"><input className="dash-field" type="url" placeholder="https://…" value={form.video} onChange={event => patch('video', event.target.value)} /></Field></div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:col-span-2"><input type="checkbox" checked={Boolean(form.featured)} onChange={event => patch('featured', event.target.checked)} className="mt-1 h-4 w-4 accent-rose-700" /><span><b className="block text-sm text-slate-800">Feature on homepage</b><span className="mt-0.5 block text-xs leading-5 text-slate-500">An intentional merchandising choice, not a sales-based bestseller claim.</span></span></label>
            <div className="sm:col-span-2"><Field label="Image URLs (optional)" hint="Paste one image URL per line if uploads are unavailable."><textarea className="dash-field min-h-24" placeholder={'https://…/photo-1.jpg\nhttps://…/photo-2.jpg'} value={form.media} onChange={event => patch('media', event.target.value)} /></Field></div>
          </div>
        </details>
      </div>

      <aside className="grid gap-5 xl:sticky xl:top-24">
        <section className="dash-card p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><ImagePlus size={19} className="text-rose-700" /> Product photos</h2><p className="mt-1 text-sm leading-5 text-slate-500">Upload several angles at once. The first photo is the cover.</p></div><span className={'rounded-full px-2.5 py-1 text-xs font-bold ' + (photoCount >= 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>{photoCount} / 3 views</span></div>
          <div className={'rounded-2xl border-2 border-dashed p-5 text-center ' + (dragging ? 'border-rose-600 bg-rose-50' : 'border-slate-300 bg-slate-50')} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); uploadFiles(event.dataTransfer.files); }}>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-rose-700 shadow-sm"><Upload size={21} /></div>
            <p className="mt-3 text-sm font-bold text-slate-800">Drop photos here</p><p className="mt-1 text-xs leading-5 text-slate-500">JPG, PNG, WEBP or AVIF · up to 8 MB per image</p>
            <button type="button" className="dash-btn-primary mt-4 inline-flex items-center gap-2" onClick={() => picker.current?.click()} disabled={uploading || !cloudinaryReady}>{uploading ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}{uploading ? 'Uploading ' + uploadProgress.done + '/' + uploadProgress.total : 'Choose multiple photos'}</button>
            <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={event => uploadFiles(event.target.files)} disabled={uploading || !cloudinaryReady} />
            {!cloudinaryReady && <p role="status" className="mt-3 text-xs font-semibold text-amber-800">Uploads are not configured. Paste URLs under More product details.</p>}
            {uploading && <div className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-rose-700" style={{ width: (uploadProgress.done / Math.max(uploadProgress.total, 1) * 100) + '%' }} /></div>}
          </div>
          {images.length > 0 && <div className="mt-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Uploaded images ({images.length})</span><span className="text-xs text-slate-500">First is cover</span></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-3">
            {images.map((url, index) => <div key={url} className={'relative aspect-[3/4] overflow-hidden rounded-xl border bg-amber-50 ' + (index === 0 ? 'border-rose-700 ring-2 ring-rose-100' : 'border-slate-200')}><ProductMedia url={url} productName={(form.name || 'Product') + ' photo ' + (index + 1)} colour={form.colour} /><span className="absolute bottom-1.5 left-1.5 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold text-white">{index === 0 ? 'Cover' : index + 1}</span><div className="absolute right-1 top-1 flex gap-1"><button type="button" className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm disabled:opacity-35" onClick={() => moveMedia(url, -1)} disabled={index === 0 || uploading} title="Move earlier" aria-label={'Move image ' + (index + 1) + ' earlier'}><ArrowUp size={13} /></button><button type="button" className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm disabled:opacity-35" onClick={() => moveMedia(url, 1)} disabled={index === images.length - 1 || uploading} title="Move later" aria-label={'Move image ' + (index + 1) + ' later'}><ArrowDown size={13} /></button><button type="button" className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-red-700 shadow-sm" onClick={() => removeMedia(url)} disabled={uploading} title="Remove image" aria-label={'Remove image ' + (index + 1)}><X size={13} /></button></div></div>)}
          </div></div>}
          {form.imageIndexes?.length > 0 && <div className="mt-4 rounded-xl border border-slate-200 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Existing catalogue views</p><p className="mt-1 text-xs leading-5 text-slate-500">These saved views are preserved alongside your uploaded photos.</p><div className="mt-2 grid grid-cols-4 gap-2">{form.imageIndexes.map((imageIndex, index) => <div key={imageIndex} className="aspect-[3/4] overflow-hidden rounded-lg border border-slate-200"><ProductMedia url="" productName={(form.name || 'Product') + ' existing photo ' + (index + 1)} colour={form.colour} imageIndex={imageIndex} /></div>)}</div></div>}
          {photoCount < 3 && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">Publish with at least three genuine views: full saree, pallu/border, and blouse or fabric detail. Do not use duplicate or unrelated photos.</p>}
          {photoCount >= 3 && <p className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-900"><CheckCircle2 size={15} className="mt-0.5 shrink-0" /> Photo minimum met. Verify all views belong to this product.</p>}
        </section>

        <section className="dash-card p-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Storefront preview</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">Preview only</span></div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="aspect-[4/3] bg-amber-50"><ProductMedia url={cover} productName={form.name || 'Product name'} colour={form.colour} imageIndex={form.imageIndexes?.[0] ?? form.imageIndex} /></div><div className="p-3.5"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-rose-800">{form.category || 'Product category'}</p><h3 className="mt-1 line-clamp-2 font-display text-lg font-semibold text-slate-900">{form.name || 'Product name appears here'}</h3><p className="mt-1 text-sm font-bold text-slate-900">{shownPrice}</p><p className="mt-1 text-xs text-slate-500">{form.colour || 'Colour not specified'}{form.fabric ? ' · ' + form.fabric : ''}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-slate-50 p-3"><span className="block text-slate-500">SKU</span><b className="mt-1 block break-all text-slate-800">{form.sku || 'Not assigned'}</b></div><div className="rounded-lg bg-slate-50 p-3"><span className="block text-slate-500">Stock</span><b className="mt-1 block text-slate-800">{form.stockOnRequest ? 'On enquiry' : (form.stock || '0') + ' units'}</b></div></div><div className="mt-3"><span className={'rounded-full px-2.5 py-1 text-xs font-semibold ' + (canPublish ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>{canPublish ? 'Ready to publish' : 'Needs details'}</span></div></section>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-10px_30px_rgba(15,23,42,0.06)] backdrop-blur lg:left-64 sm:px-6"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3"><div className="hidden text-sm text-slate-500 sm:block">{dirty ? 'Unsaved changes' : 'All changes saved'} · {photoCount} photo view(s)</div><div className="ml-auto flex flex-wrap justify-end gap-2"><button type="button" className="dash-btn-ghost" onClick={leaveEditor} disabled={busy || uploading}>Cancel</button><button type="button" className="dash-btn-ghost" onClick={() => save('draft')} disabled={busy || uploading || !firebaseReady}><Save size={16} /> Save draft</button><button type="button" className="dash-btn-primary" onClick={() => save('active')} disabled={busy || uploading || !firebaseReady}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{busy ? 'Saving…' : (original?.status === 'active' ? 'Save & publish' : 'Publish product')}</button></div></div></div>
    </form>
  </div>;
}
