import { useState } from 'react';
import { CheckCircle, Clock, MapPin, MessageCircle, Phone } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import { storeInfo } from '../data';
import { createEnquiry } from '../services/firestore';
import { generateWhatsAppLink } from '../services/whatsapp';

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  const submit = async e => {
    e.preventDefault();
    await createEnquiry({
      type: 'general',
      customerName: form.name,
      phone: form.phone,
      email: form.email,
      message: form.message,
    });
    const text = `Hello Ashu Silks!\n\nName: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email || '-'}\n\nMessage:\n${form.message}`;
    window.open(generateWhatsAppLink(text), '_blank');
    setSent(true);
  };

  return (
    <>
      <Breadcrumbs items={[{ label: 'Contact' }]} />
      <section className="section page-section">
        <div className="container contact-grid">
          <div className="contact-card">
            <span className="eyebrow">Visit / Enquire</span>
            <h2>Contact Ashu Silks</h2>
            <p><Phone /> {storeInfo.phone}</p>
            <p><Clock /> {storeInfo.hours}</p>
            <p><MapPin /> {storeInfo.address}</p>
            <a className="btn primary" href={`https://wa.me/${storeInfo.whatsapp}`} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> WhatsApp Now
            </a>
          </div>

          <div className="contact-card">
            {sent ? (
              <div className="success-box">
                <CheckCircle size={48} />
                <h3>Enquiry sent!</h3>
                <p>We opened WhatsApp with your message and saved it for follow-up.</p>
              </div>
            ) : (
              <form className="form" onSubmit={submit}>
                <h3>Send an enquiry</h3>
                <input required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <input required placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <input type="email" placeholder="Email (optional)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <textarea required placeholder="Tell us what you are looking for" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                <button className="btn primary">Submit Enquiry</button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="section story">
        <div className="container">
          <iframe title="Ashu Silks Map" src={storeInfo.mapEmbed} loading="lazy" />
        </div>
      </section>
    </>
  );
}
