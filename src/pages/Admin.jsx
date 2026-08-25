import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, RefreshCw, Save, Upload, X, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCatalogProducts, createCatalogProduct, updateCatalogProduct, deleteCatalogProduct } from '../services/catalog';
import { uploadProductImage, cloudinaryReady } from '../services/cloudinary';

const empty = { name: '', category: 'Kanjeevaram Silk', price: '', mrp: '', stock: '0', sku: '', colour: '', fabric: '', occasion: '', description: '', media: '', featured: false };
const categories = ['Kanjeevaram Silk', 'Bridal', 'Designer', 'Cotton', 'Tissue Silk'];

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');

  const load = async () => {
    setBusy(true); setError('');
    try { setProducts(await getCatalogProducts()); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);

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
      const data = { ...form, price: Number(form.price), mrp: Number(form.mrp || form.price), stock: Number(form.stock), media, featured: Boolean(form.featured) };
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
    setForm({ ...empty, ...p, media, price: String(p.price ?? ''), mrp: String(p.mrp ?? ''), stock: String(p.stock ?? '0') });
    setPreview(Array.isArray(p.media) ? p.media[0] : (p.media || ''));
  };

  const remove = async id => {
    if (!confirm('Delete this product?')) return;
    setBusy(true);
    try { await deleteCatalogProduct(id); toast.success('Product deleted'); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const clear = () => { setEditing(null); setForm(empty); setPreview(''); };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500">Manage catalogue, stock and product images.</p>
        </div>
        <button className="dash-btn-ghost" onClick={load} disabled={busy}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <form className="dash-card grid gap-3 p-5" onSubmit={save}>
          <h2 className="flex items-center gap-2 font-semibold text-slate-900"><Package size={18} /> {editing ? 'Edit product' : 'Add product'}</h2>
          <input className="dash-field" required placeholder="Product name" value={form.name} onChange={e => set('name', e.target.value)} />
          <select className="dash-field" required value={form.category} onChange={e => set('category', e.target.value)}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input className="dash-field" required type="number" min="0" step="1" placeholder="Price" value={form.price} onChange={e => set('price', e.target.value)} />
            <input className="dash-field" type="number" min="0" step="1" placeholder="MRP" value={form.mrp} onChange={e => set('mrp', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="dash-field" required type="number" min="0" step="1" placeholder="Stock" value={form.stock} onChange={e => set('stock', e.target.value)} />
            <input className="dash-field" required placeholder="SKU" value={form.sku} onChange={e => set('sku', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="dash-field" placeholder="Colour" value={form.colour} onChange={e => set('colour', e.target.value)} />
            <input className="dash-field" placeholder="Fabric" value={form.fabric} onChange={e => set('fabric', e.target.value)} />
          </div>
          <input className="dash-field" placeholder="Occasion" value={form.occasion} onChange={e => set('occasion', e.target.value)} />
          <textarea className="dash-field min-h-24" placeholder="Description" value={form.description} onChange={e => set('description', e.target.value)} />

          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900"><ImagePlus size={18} /> Product images</div>
            <p className="mt-1 text-sm text-slate-500">Upload JPG, PNG, WEBP or AVIF. Maximum 8 MB each.</p>
            {!cloudinaryReady && (
              <p className="mt-1 text-sm font-semibold text-red-600">Cloudinary is not configured — add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET, or paste image URLs below directly.</p>
            )}
            <label className={`dash-btn-ghost mt-3 inline-flex ${cloudinaryReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
              <Upload size={16} />{uploading ? 'Uploading...' : 'Choose images'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={chooseFiles} disabled={uploading || !cloudinaryReady} />
            </label>
            {preview && <img className="mt-3 h-40 w-32 rounded-lg object-cover" src={preview} alt="Product preview" />}
            <textarea className="dash-field mt-3 min-h-20" placeholder="Uploaded image URLs appear here. One per line." value={form.media} onChange={e => set('media', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={!!form.featured} onChange={e => set('featured', e.target.checked)} /> Featured product
          </label>

          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="dash-btn-ghost" onClick={clear}><X size={16} /> Clear</button>
            <button className="dash-btn-primary" disabled={busy || uploading}>
              {editing ? <Save size={16} /> : <Plus size={16} />} {editing ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </form>

        <div className="grid content-start gap-2.5">
          <h2 className="mb-1 font-semibold text-slate-900">Live products ({products.length})</h2>
          {products.map(p => (
            <article className="flex flex-col items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between" key={p.id}>
              <div className="flex items-center gap-3">
                {(Array.isArray(p.media) ? p.media[0] : p.media) && (
                  <img className="h-14 w-14 rounded-lg object-cover" src={Array.isArray(p.media) ? p.media[0] : p.media} alt="" />
                )}
                <div className="grid gap-0.5">
                  <b className="text-slate-900">{p.name}</b>
                  <span className="text-sm text-slate-500">{p.sku} · {p.category}</span>
                  <span className="text-sm text-slate-500">₹{p.price} · Stock: {p.stock}</span>
                </div>
              </div>
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <button className="dash-btn-ghost" onClick={() => edit(p)}>Edit</button>
                <button className="dash-btn-danger" onClick={() => remove(p.id)} aria-label="Delete"><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
