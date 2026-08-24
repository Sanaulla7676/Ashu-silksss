import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, ShoppingBag, Star, Truck, ShieldCheck, CheckCircle } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import Modal from '../components/Modal';
import ProductGrid from '../components/ProductGrid';
import ProductMedia from '../components/ProductMedia';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { fetchLiveProduct, fetchLiveProducts } from '../services/liveCatalog';
import { createEnquiry } from '../services/firestore';
import { generateEnquiryMessage, generateWhatsAppLink } from '../services/whatsapp';
import { discountPercent, mediaUrl, money } from '../utils';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  useEffect(() => {
    let active = true;
    Promise.all([fetchLiveProduct(id), fetchLiveProducts()]).then(([found, all]) => {
      if (!active) return;
      setProduct(found);
      setRelated(found ? all.filter(p => p.id !== found.id && p.category === found.category && Number(p.stock ?? 0) > 0).slice(0, 4) : []);
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading) return <section className="section"><div className="container empty"><h2>Loading saree...</h2></div></section>;
  if (!product) return <section className="section"><div className="container empty"><h2>Product not found</h2><p>This saree is not available right now.</p><Link className="btn primary" to="/products">Back to products</Link></div></section>;

  const discount = discountPercent(product.price, product.mrp);
  const submitEnquiry = async e => {
    e.preventDefault();
    await createEnquiry({ productId: product.id, productName: product.name, productSku: product.sku, customerName: form.name, phone: form.phone, email: form.email, message: form.message });
    setSent(true);
    window.open(generateWhatsAppLink(generateEnquiryMessage(product, form)), '_blank');
  };

  return <>
    <Breadcrumbs items={[{ label: 'Products', to: '/products' }, { label: product.name }]} />
    <section className="section page-section"><div className="container detail product-detail-page">
      <div className="product-gallery"><div className="detail-media"><ProductMedia url={mediaUrl(product)} />{discount > 0 && <span className="detail-discount">{discount}% OFF</span>}</div><div className="trust-row"><span><Truck size={18}/> Fast delivery</span><span><ShieldCheck size={18}/> Quality checked</span></div></div>
      <div className="product-info"><span className="eyebrow">{product.category}</span><h1>{product.name}</h1><div className="rating-row large"><span><Star size={16} fill="#c9a227"/> 4.8 rating</span><span>SKU: {product.sku}</span></div><p className="lead">{product.description}</p><div className="detail-price"><b>{money(product.price)}</b>{product.mrp && <s>{money(product.mrp)}</s>}{discount > 0 && <span>You save {money(product.mrp-product.price)}</span>}</div><div className="spec-grid"><div><span>Colour</span><b>{product.colour}</b></div><div><span>Fabric</span><b>{product.fabric}</b></div><div><span>Occasion</span><b>{product.occasion}</b></div><div><span>Care</span><b>{product.care}</b></div></div><div className="stock-note"><CheckCircle size={18}/> {product.stock} pieces available in store</div><div className="detail-actions"><button className="btn primary" onClick={()=>addToCart(product)}><ShoppingBag size={18}/> Add to Cart</button><button className="btn dark" onClick={()=>setEnquiryOpen(true)}><MessageCircle size={18}/> Enquire</button><button className="btn ghost" onClick={()=>addToWishlist(product.id)}><Heart size={18} fill={isInWishlist(product.id)?'#c9a227':'none'}/> Wishlist</button><button className="btn ghost" onClick={()=>navigator.share?.({title:product.name,url:location.href})}><Share2 size={18}/> Share</button></div></div>
    </div></section>
    <section className="section story"><div className="container"><div className="section-head"><div><span className="eyebrow">You may also like</span><h2>Related sarees</h2></div></div><ProductGrid products={related}/></div></section>
    {enquiryOpen && <Modal title={`Enquire about ${product.name}`} onClose={()=>setEnquiryOpen(false)}>{sent?<div className="success-box"><CheckCircle size={48}/><h3>Enquiry sent!</h3><p>We opened WhatsApp with your product enquiry. Our team will respond shortly.</p><button className="btn primary" onClick={()=>setEnquiryOpen(false)}>Done</button></div>:<form className="form" onSubmit={submitEnquiry}><input required placeholder="Your name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input type="email" placeholder="Email (optional)" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input readOnly value={product.name}/><textarea placeholder="What would you like to know?" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><button className="btn primary" type="submit">Send Enquiry</button></form>}</Modal>}
  </>;
}
