import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, RefreshCw, Save, Upload, X, ImagePlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCatalogProducts, createCatalogProduct, updateCatalogProduct, deleteCatalogProduct } from '../services/catalog';
import { uploadProductImage, deleteProductImage } from '../services/storage';
import '../admin.css';

const empty={name:'',category:'Kanjeevaram Silk',price:'',mrp:'',stock:'0',sku:'',colour:'',fabric:'',occasion:'',description:'',media:'',featured:false};
const categories=['Kanjeevaram Silk','Bridal','Designer','Cotton','Tissue Silk'];

export default function Admin(){
 const{user,loading}=useAuth(); const[products,setProducts]=useState([]),[form,setForm]=useState(empty),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState(''),[admin,setAdmin]=useState(false),[preview,setPreview]=useState('');
 useEffect(()=>{if(user)user.getIdTokenResult(true).then(r=>setAdmin(r.claims.admin===true)).catch(()=>setAdmin(false))},[user]);
 const load=async()=>{setBusy(true);setError('');try{setProducts(await getCatalogProducts())}catch(e){setError(e.message)}finally{setBusy(false)}};
 useEffect(()=>{if(admin)load()},[admin]);
 if(loading)return <section className="section"><div className="container empty"><h2>Loading admin...</h2></div></section>;
 if(!user)return <section className="section"><div className="container empty"><h2>Admin sign-in required</h2></div></section>;
 if(!admin)return <section className="section"><div className="container empty"><h2>Access denied</h2><p>Your Firebase account does not have the admin claim.</p></div></section>;
 const set=(k,v)=>setForm(x=>({...x,[k]:v}));
 const chooseFiles=async e=>{const files=Array.from(e.target.files||[]);if(!files.length)return;setUploading(true);setError('');try{const urls=[];for(const file of files)urls.push(await uploadProductImage(file,editing||'new'));setForm(x=>({...x,media:[x.media,...urls].filter(Boolean).join('\n')}));if(urls[0])setPreview(urls[0])}catch(e){setError(e.message)}finally{setUploading(false);e.target.value=''}};
 const save=async e=>{e.preventDefault();setBusy(true);setError('');try{const media=form.media.split(/\n|,/).map(x=>x.trim()).filter(Boolean);const data={...form,price:Number(form.price),mrp:Number(form.mrp||form.price),stock:Number(form.stock),media,featured:Boolean(form.featured)};editing?await updateCatalogProduct(editing,data):await createCatalogProduct(data);setForm(empty);setEditing(null);setPreview('');await load()}catch(e){setError(e.message)}finally{setBusy(false)}};
 const edit=p=>{setEditing(p.id);const media=Array.isArray(p.media)?p.media.join('\n'):(p.media||'');setForm({...empty,...p,media,price:String(p.price??''),mrp:String(p.mrp??''),stock:String(p.stock??'0')});setPreview(Array.isArray(p.media)?p.media[0]:(p.media||''))};
 const remove=async id=>{if(!confirm('Delete this product?'))return;setBusy(true);try{await deleteCatalogProduct(id);await load()}catch(e){setError(e.message)}finally{setBusy(false)}};
 const clear=()=>{setEditing(null);setForm(empty);setPreview('')};
 return <section className="section page-section"><div className="container"><div className="section-head"><div><span className="eyebrow">Ashu Silks</span><h2>Admin Dashboard</h2><p>Manage products, stock and product images.</p></div><button className="btn ghost" onClick={load} disabled={busy}><RefreshCw size={17}/> Refresh</button></div>
 {error&&<div className="checkout-card" style={{marginBottom:18,color:'#b42318'}}>{error}</div>}
 <div className="admin-grid"><form className="checkout-card form" onSubmit={save}><h3><Package size={20}/> {editing?'Edit product':'Add product'}</h3>
 <input required placeholder="Product name" value={form.name} onChange={e=>set('name',e.target.value)}/>
 <select required value={form.category} onChange={e=>set('category',e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select>
 <div className="form-row"><input required type="number" min="0" step="1" placeholder="Price" value={form.price} onChange={e=>set('price',e.target.value)}/><input type="number" min="0" step="1" placeholder="MRP" value={form.mrp} onChange={e=>set('mrp',e.target.value)}/></div>
 <div className="form-row"><input required type="number" min="0" step="1" placeholder="Stock" value={form.stock} onChange={e=>set('stock',e.target.value)}/><input required placeholder="SKU" value={form.sku} onChange={e=>set('sku',e.target.value)}/></div>
 <div className="form-row"><input placeholder="Colour" value={form.colour} onChange={e=>set('colour',e.target.value)}/><input placeholder="Fabric" value={form.fabric} onChange={e=>set('fabric',e.target.value)}/></div>
 <input placeholder="Occasion" value={form.occasion} onChange={e=>set('occasion',e.target.value)}/><textarea placeholder="Description" value={form.description} onChange={e=>set('description',e.target.value)}/>
 <div className="upload-box"><div className="upload-title"><ImagePlus size={20}/><b>Product images</b></div><p>Upload JPG, PNG, WEBP or AVIF. Maximum 8 MB each.</p><label className="btn ghost upload-button"><Upload size={17}/>{uploading?'Uploading...':'Choose images'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={chooseFiles} disabled={uploading}/></label>{preview&&<img className="admin-image-preview" src={preview} alt="Product preview"/>}<textarea placeholder="Uploaded image URLs appear here. One per line." value={form.media} onChange={e=>set('media',e.target.value)}/></div>
 <label className="check-row"><input type="checkbox" checked={!!form.featured} onChange={e=>set('featured',e.target.checked)}/> Featured product</label>
 <div className="checkout-actions"><button type="button" className="btn ghost" onClick={clear}><X size={17}/> Clear</button><button className="btn primary" disabled={busy||uploading}>{editing?<Save size={17}/>:<Plus size={17}/>} {editing?'Save changes':'Add product'}</button></div></form>
 <div className="admin-list"><h3>Live products ({products.length})</h3>{products.map(p=><article className="admin-product" key={p.id}>{(Array.isArray(p.media)?p.media[0]:p.media)&&<img src={Array.isArray(p.media)?p.media[0]:p.media} alt=""/>}<div><b>{p.name}</b><span>{p.sku} · {p.category}</span><span>₹{p.price} · Stock: {p.stock}</span></div><div className="admin-actions"><button className="btn ghost" onClick={()=>edit(p)}>Edit</button><button className="icon" onClick={()=>remove(p.id)} aria-label="Delete"><Trash2 size={17}/></button></div></article>)}</div></div></div></section>
}
