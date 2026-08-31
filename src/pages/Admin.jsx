import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, Plus, Trash2, RefreshCw, Save, Upload, X, ImagePlus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCatalogProducts, createCatalogProduct, updateCatalogProduct, deleteCatalogProduct } from '../services/catalog';
import { uploadProductImage, cloudinaryReady } from '../services/cloudinary';

const empty = {
  name: '', brand: 'Ashu Silks', category: 'Kanjeevaram Silk', sku: '', status: 'active',
  price: '', mrp: '', gstPercent: '5', stock: '',
  colour: '', fabric: '', pattern: '', occasion: '', workType: '', blousePiece: 'Included',
  sareeLength: '6.3 metres with blouse piece', washCare: 'Dry clean only', countryOfOrigin: 'India', weight: '',
  description: '', highlights: '', tags: '',
  media: '', video: '', featured: false,
};
const categories = ['Kanjeevaram Silk', 'Bridal', 'Designer', 'Cotton', 'Tissue Silk'];
const blouseOptions = ['Included', 'Not included', 'Running blouse fabric'];
const patternOptions = ['Checked', 'Striped', 'Zari Woven', 'Floral', 'Solid', 'Printed', 'Embroidered', 'Temple Border'];

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
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [stockDrafts, setStockDrafts] = useState({});

  const load = async () => {
    setBusy(true); setError('');
    try { setProducts(await getCatalogProducts()); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const incomingMedia = location.state?.media;
    if (incomingMedia?.length) {
      setEditing(null);
      setForm({ ...empty, media: incomingMedia.join('\n') });
      setPreview(incomingMedia[0]);
      toast.success(`${incomingMedia.length} photo(s) attached — fill in the details below`);
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
    } catch (e) { setError(e.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const save = async e => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const media = form.media.split(/\n|,/).map(x => x.trim()).filter(Boolean);
      const highlights = form.highlights.split('\n').map(x => x.trim()).filter(Boolean);
      const tags = form.tags.split(',').map(x => x.trim()).filter(Boolean);
      const data = {
        ...form, media, highlights, tags,
        price: Number(form.price), mrp: Number(form.mrp || form.price),
        gstPercent: Number(form.gstPercent || 0), stock: Number(form.stock),
        weight: Number(form.weight || 0), featured: Boolean(form.featured),
      };
      editing ? await updateCatalogProduct(editing, data) : await createCatalogProduct(data);
      toast.success(editing ? 'Product updated' : 'Product added');
      setForm(empty); setEditing(null); setPreview('');
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const edit = p => {
    setEditing(p.id);
    const media = Array.isArray(p.media) ? p.media.join('\n') : (p.media || '');
    const highlights = Array.isArray(p.highlights) ? p.highlights.join('\n') : (p.highlights || '');
    const tags = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');
    setForm({
      ...empty, ...p, media, highlights, tags,
      price: String(p.price ?? ''), mrp: String(p.mrp ?? ''), stock: String(p.stock ?? '0'),
      gstPercent: String(p.gstPercent ?? '5'), weight: String(p.weight ?? ''),
    });
    setPreview(Array.isArray(p.media) ? p.media[0] : (p.media || ''));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async id => {
    if (!confirm('Delete this product?')) return;
    setBusy(true);
    try { await deleteCatalogProduct(id); toast.success('Product deleted'); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const clear = () => { setEditing(null); setForm(empty); setPreview(''); };

  const stockValue = p => stockDrafts[p.id] ?? String(p.stock ?? 0);
  const setStockDraft = (id, v) => setStockDrafts(d => ({ ...d, [id]: v }));
  const saveStock = async p => {
    const value = Number(stockDrafts[p.id]);
    if (Number.isNaN(value) || value < 0) { toast.error('Enter a valid stock number'); return; }
    try {
      await updateCatalogProduct(p.id, { stock: value });
      toast.success(`${p.name || 'Product'} stock updated`);
      setStockDrafts(d => { const next = { ...d }; delete next[p.id]; return next; });
      await load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">Manage catalogue, stock, pricing and images. New products publish live immediately — a product also needs Stock above 0 to actually show on the site.</p>
        </div>
        <button className="dash-btn-ghost" onClick={load} disabled={busy}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">{error}</div>}

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
                {categories.map(c => <option key={c}>{c}</option>)}
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
              <input className="dash-field" required type="number" min="0" step="1" placeholder="Selling price (₹)" value={form.price} onChange={e => set('price', e.target.value)} />
              <input className="dash-field" type="number" min="0" step="1" placeholder="MRP (₹)" value={form.mrp} onChange={e => set('mrp', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="dash-field" type="number" min="0" step="0.1" placeholder="GST %" value={form.gstPercent} onChange={e => set('gstPercent', e.target.value)} />
              <input className="dash-field" required type="number" min="0" step="1" placeholder="Stock quantity" value={form.stock} onChange={e => set('stock', e.target.value)} />
            </div>
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
            {preview && <img className="h-40 w-32 rounded-lg object-cover" src={preview} alt="Product preview" />}
            <textarea className="dash-field min-h-20" placeholder="Image URLs, one per line" value={form.media} onChange={e => set('media', e.target.value)} />
            <input className="dash-field" placeholder="Video URL (optional)" value={form.video} onChange={e => set('video', e.target.value)} />
          </Section>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={!!form.featured} onChange={e => set('featured', e.target.checked)} /> Featured on homepage
          </label>

          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="dash-btn-ghost" onClick={clear}><X size={16} /> Clear</button>
            <button className="dash-btn-primary" disabled={busy || uploading}>
              {editing ? <Save size={16} /> : <Plus size={16} />} {editing ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </form>

        <div className="grid content-start gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">All products ({products.length})</h2>
            <Link to="/admin/import" className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline">
              <Sparkles size={14} /> Import from photos
            </Link>
          </div>
          {products.map(p => (
            <article className="flex flex-col items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between" key={p.id}>
              <div className="flex items-center gap-3">
                {(Array.isArray(p.media) ? p.media[0] : p.media) && (
                  <img className="h-14 w-14 rounded-lg object-cover" src={Array.isArray(p.media) ? p.media[0] : p.media} alt="" />
                )}
                <div className="grid gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <b className="text-slate-900">{p.name || 'Untitled product'}</b>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                    {p.status === 'active' && Number(p.stock ?? 0) <= 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">Hidden — 0 stock</span>
                    )}
                  </div>
                  <span className="text-sm text-slate-500">{p.sku || 'no SKU'} · {p.category}</span>
                  <span className="text-sm text-slate-500">₹{p.price || 0} · {(Array.isArray(p.media) ? p.media.length : (p.media ? 1 : 0))} photo(s)</span>
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
                <button className="dash-btn-danger" onClick={() => remove(p.id)} aria-label="Delete"><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
          {!products.length && !busy && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              No products yet. <Link to="/admin/import" className="font-semibold text-indigo-600 hover:underline">Import from your uploaded photos</Link> or add one manually.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
