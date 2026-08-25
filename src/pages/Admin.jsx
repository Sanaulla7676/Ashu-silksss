import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, RefreshCw, Save, Upload, X, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getCatalogProducts, createCatalogProduct, updateCatalogProduct, deleteCatalogProduct } from '../services/catalog';
import { uploadProductImage } from '../services/storage';

const empty = { name: '', category: 'Kanjeevaram Silk', price: '', mrp: '', stock: '0', sku: '', colour: '', fabric: '', occasion: '', description: '', media: '', featured: false };
const categories = ['Kanjeevaram Silk', 'Bridal', 'Designer', 'Cotton', 'Tissue Silk'];

function EmptyPage({ title, text }) {
  return (
    <section className="py-16 md:py-24">
      <div className="container rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
        <h2 className="font-display text-ink">{title}</h2>
        {text && <p className="mt-2">{text}</p>}
      </div>
    </section>
  );
}

export default function Admin() {
  const { user, loading } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [admin, setAdmin] = useState(false);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (user) user.getIdTokenResult(true).then(r => setAdmin(r.claims.admin === true)).catch(() => setAdmin(false));
  }, [user]);

  const load = async () => {
    setBusy(true); setError('');
    try { setProducts(await getCatalogProducts()); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (admin) load(); }, [admin]);

  if (loading) return <EmptyPage title="Loading admin..." />;
  if (!user) return <EmptyPage title="Admin sign-in required" />;
  if (!admin) return <EmptyPage title="Access denied" text="Your Firebase account does not have the admin claim." />;

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
    <section className="pb-16 pt-2 md:pb-24">
      <div className="container">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="eyebrow">Ashu Silks</span>
            <h2 className="heading-xl text-[clamp(1.8rem,4vw,2.6rem)]">Admin Dashboard</h2>
            <p className="text-muted">Manage products, stock and product images.</p>
          </div>
          <button className="btn-ghost" onClick={load} disabled={busy}><RefreshCw size={17} /> Refresh</button>
        </div>

        {error && <div className="card-surface mb-4 p-4 font-bold text-danger">{error}</div>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
          <form className="card-surface grid gap-3 p-5 sm:p-6" onSubmit={save}>
            <h3 className="flex items-center gap-2 text-wine"><Package size={20} /> {editing ? 'Edit product' : 'Add product'}</h3>
            <input className="field" required placeholder="Product name" value={form.name} onChange={e => set('name', e.target.value)} />
            <select className="field" required value={form.category} onChange={e => set('category', e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input className="field" required type="number" min="0" step="1" placeholder="Price" value={form.price} onChange={e => set('price', e.target.value)} />
              <input className="field" type="number" min="0" step="1" placeholder="MRP" value={form.mrp} onChange={e => set('mrp', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="field" required type="number" min="0" step="1" placeholder="Stock" value={form.stock} onChange={e => set('stock', e.target.value)} />
              <input className="field" required placeholder="SKU" value={form.sku} onChange={e => set('sku', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="field" placeholder="Colour" value={form.colour} onChange={e => set('colour', e.target.value)} />
              <input className="field" placeholder="Fabric" value={form.fabric} onChange={e => set('fabric', e.target.value)} />
            </div>
            <input className="field" placeholder="Occasion" value={form.occasion} onChange={e => set('occasion', e.target.value)} />
            <textarea className="field min-h-24" placeholder="Description" value={form.description} onChange={e => set('description', e.target.value)} />

            <div className="rounded border border-dashed border-ink/15 bg-ivory p-4">
              <div className="flex items-center gap-2 font-bold text-wine"><ImagePlus size={20} /> Product images</div>
              <p className="mt-1 text-sm text-muted">Upload JPG, PNG, WEBP or AVIF. Maximum 8 MB each.</p>
              <label className="btn-ghost mt-3 inline-flex cursor-pointer">
                <Upload size={17} />{uploading ? 'Uploading...' : 'Choose images'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={chooseFiles} disabled={uploading} />
              </label>
              {preview && <img className="mt-3 h-40 w-32 rounded object-cover" src={preview} alt="Product preview" />}
              <textarea className="field mt-3 min-h-20" placeholder="Uploaded image URLs appear here. One per line." value={form.media} onChange={e => set('media', e.target.value)} />
            </div>

            <label className="flex items-center gap-2 font-bold text-ink">
              <input type="checkbox" checked={!!form.featured} onChange={e => set('featured', e.target.checked)} /> Featured product
            </label>

            <div className="flex flex-wrap gap-2.5">
              <button type="button" className="btn-ghost" onClick={clear}><X size={17} /> Clear</button>
              <button className="btn-primary" disabled={busy || uploading}>
                {editing ? <Save size={17} /> : <Plus size={17} />} {editing ? 'Save changes' : 'Add product'}
              </button>
            </div>
          </form>

          <div className="grid content-start gap-2.5">
            <h3 className="mb-1 font-display text-ink">Live products ({products.length})</h3>
            {products.map(p => (
              <article className="flex flex-col items-start gap-4 rounded border border-ink/10 bg-paper p-4 sm:flex-row sm:items-center sm:justify-between" key={p.id}>
                <div className="flex items-center gap-3">
                  {(Array.isArray(p.media) ? p.media[0] : p.media) && (
                    <img className="h-14 w-14 rounded-xl object-cover" src={Array.isArray(p.media) ? p.media[0] : p.media} alt="" />
                  )}
                  <div className="grid gap-0.5">
                    <b className="text-ink">{p.name}</b>
                    <span className="text-sm text-muted">{p.sku} · {p.category}</span>
                    <span className="text-sm text-muted">₹{p.price} · Stock: {p.stock}</span>
                  </div>
                </div>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <button className="btn-ghost" onClick={() => edit(p)}>Edit</button>
                  <button className="icon-btn" onClick={() => remove(p.id)} aria-label="Delete"><Trash2 size={17} /></button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
