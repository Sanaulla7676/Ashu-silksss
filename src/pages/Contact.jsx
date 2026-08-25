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
      <section className="pb-16 pt-2 md:pb-24">
        <div className="container grid grid-cols-1 items-start gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="card-surface p-6">
            <span className="eyebrow">Visit / Enquire</span>
            <h2 className="heading-xl text-[clamp(1.8rem,4vw,2.6rem)]">Contact Ashu Silks</h2>
            <div className="mt-4 grid gap-3 text-muted">
              <p className="flex items-start gap-2.5"><Phone size={18} className="mt-0.5 shrink-0 text-wine" /> {storeInfo.phone}</p>
              <p className="flex items-start gap-2.5"><Clock size={18} className="mt-0.5 shrink-0 text-wine" /> {storeInfo.hours}</p>
              <p className="flex items-start gap-2.5"><MapPin size={18} className="mt-0.5 shrink-0 text-wine" /> {storeInfo.address}</p>
            </div>
            <a className="btn-primary mt-4" href={`https://wa.me/${storeInfo.whatsapp}`} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> WhatsApp Now
            </a>
          </div>

          <div className="card-surface p-6">
            {sent ? (
              <div className="py-4 text-center">
                <CheckCircle size={48} className="mx-auto text-success" />
                <h3 className="mt-3 font-display text-ink">Enquiry sent!</h3>
                <p className="mt-1 text-muted">We opened WhatsApp with your message and saved it for follow-up.</p>
              </div>
            ) : (
              <form className="grid gap-3" onSubmit={submit}>
                <h3 className="text-wine">Send an enquiry</h3>
                <input className="field" required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <input className="field" required placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <input className="field" type="email" placeholder="Email (optional)" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <textarea className="field min-h-28" required placeholder="Tell us what you are looking for" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                <button className="btn-primary">Submit Enquiry</button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-paper to-white py-16 md:py-24">
        <div className="container">
          <iframe title="Ashu Silks Map" className="h-[320px] w-full rounded-md border border-ink/10 sm:h-[420px]" src={storeInfo.mapEmbed} loading="lazy" />
        </div>
      </section>
    </>
  );
}
