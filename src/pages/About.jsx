import Breadcrumbs from '../components/Breadcrumbs';
import { Award, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const values = [
  { icon: Sparkles, title: 'Curated Designs', text: 'Only sarees that feel premium and photograph beautifully.' },
  { icon: ShieldCheck, title: 'Trusted Quality', text: 'Fabric and finishing checked before every purchase.' },
  { icon: Heart, title: 'Personal Care', text: 'Friendly enquiry support for every customer.' },
  { icon: Award, title: 'Wedding Ready', text: 'Bridal selections for every ceremony and style.' },
];

export default function About() {
  return (
    <>
      <Breadcrumbs items={[{ label: 'About' }]} />
      <section className="bg-gradient-to-br from-paper to-white pb-16 pt-2 md:pb-24">
        <div className="container grid grid-cols-1 items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.div
            className="grid min-h-[280px] place-items-center rounded-md bg-gradient-to-br from-wine-2 to-gold text-[8rem] text-white/20 shadow-[var(--shadow-lift)] sm:min-h-[420px] sm:text-[14rem] lg:text-[18rem]"
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-display">A</span>
          </motion.div>
          <div>
            <span className="eyebrow">Our Story</span>
            <h1 className="heading-xl">Ashu Silks</h1>
            <p className="lead">
              Ashu Silks brings together traditional Indian craftsmanship and modern shopping convenience.
              From rich bridal Kanjeevarams to breathable cotton sarees, every drape is chosen for beauty,
              comfort and lasting value.
            </p>
            <p className="mt-3 text-muted">
              Visit our Bengaluru store for personal recommendations, or shop online with easy enquiry,
              WhatsApp support and order placement.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {values.map(v => (
                <div key={v.title} className="card-surface p-5">
                  <div className="mb-3 grid h-11 w-11 place-items-center rounded bg-gold-2/25 text-wine">
                    <v.icon size={22} />
                  </div>
                  <h3 className="mb-1 text-wine">{v.title}</h3>
                  <p className="text-muted">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
