import { Link } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Truck, ShieldCheck, Scissors, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductGrid from '../components/ProductGrid';
import { useProducts } from '../hooks/useProducts';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const features = [
  { icon: Truck, title: 'Fast Delivery', text: 'Carefully packed sarees delivered across Bengaluru and India.' },
  { icon: ShieldCheck, title: 'Quality Checked', text: 'Every saree is inspected for fabric, zari and finishing before dispatch.' },
  { icon: Scissors, title: 'Blouse Support', text: 'Ask us about blouse matching and finishing options.' },
  { icon: Award, title: 'Wedding Ready', text: 'Premium bridal picks for receptions, engagements and festivals.' },
];

export default function Home() {
  const { featuredProducts, categories } = useProducts();

  return (
    <>
      <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-wine-3 md:min-h-[calc(100vh-108px)]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/ashuvedio.mp4"
          autoPlay
          muted
          playsInline
          loop
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,16,26,.86)_0%,rgba(23,35,55,.62)_45%,rgba(23,35,55,.2)_100%),linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.4))]" />

        <div className="container relative z-10 py-16 md:py-24">
          <motion.div
            className="max-w-[760px] text-white"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-white/22 bg-white/10 px-3.5 py-2 font-extrabold backdrop-blur"
            >
              <Sparkles size={16} /> Bengaluru's Trusted Saree Store
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="my-4 font-display text-[clamp(2.2rem,8vw,4.6rem)] font-black leading-[1.02] text-shadow-[0_10px_38px_rgba(0,0,0,.4)]"
            >
              Sarees, sorted by what sells.
            </motion.h1>
            <motion.p variants={fadeUp} className="max-w-[640px] text-base text-white/88 sm:text-lg">
              Kanjeevaram, bridal, designer and cotton sarees at direct prices — free delivery,
              real-time WhatsApp support, and pay however suits you.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
              <Link className="btn-primary" to="/products">
                <ShoppingBag size={18} /> Shop Collection
              </Link>
              <Link className="btn-outline-light" to="/contact">
                <MessageCircle size={18} /> Enquire Now
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-7 grid max-w-[560px] grid-cols-3 gap-3">
              {[['500+', 'Styles in stock'], ['4.8★', '12k+ ratings'], ['Free', 'Delivery, always']].map(([n, l]) => (
                <div key={l} className="rounded bg-white/10 p-3.5 text-center sm:text-left">
                  <b className="block font-display text-xl text-gold-2 sm:text-2xl">{n}</b>
                  <span className="text-[0.8rem] text-white/75">{l}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mb-7 flex items-end justify-between gap-6">
            <div>
              <span className="eyebrow">Why shop with us</span>
              <h2 className="heading-xl">Fast, checked, hassle-free</h2>
            </div>
          </div>
          <motion.div
            className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {features.map(f => (
              <motion.div key={f.title} variants={fadeUp} className="card-surface p-5 text-left md:p-6">
                <div className="mb-3.5 grid h-11 w-11 place-items-center rounded bg-gold-2/25 text-wine">
                  <f.icon size={22} />
                </div>
                <h3 className="mb-1.5 text-wine">{f.title}</h3>
                <p className="text-muted">{f.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-paper to-white py-16 md:py-24">
        <div className="container">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Featured Collection</span>
              <h2 className="heading-xl">Customer favourites</h2>
              <p className="max-w-[650px] text-muted">Handpicked sarees with beautiful texture, rich colours and festive presence.</p>
            </div>
            <Link className="btn-dark self-start" to="/products">View all</Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mb-7">
            <span className="eyebrow">Shop by Style</span>
            <h2 className="heading-xl">Explore categories</h2>
          </div>
          <motion.div
            className="grid grid-cols-2 gap-4 md:grid-cols-5"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {categories.filter(c => c !== 'All').map(category => (
              <motion.div key={category} variants={fadeUp}>
                <Link
                  className="group relative flex min-h-[150px] flex-col justify-between overflow-hidden rounded-md bg-gradient-to-br from-wine to-wine-2 p-5 text-white shadow-[var(--shadow-lift)] sm:min-h-[170px]"
                  to={`/products/${encodeURIComponent(category)}`}
                >
                  <span className="absolute -right-8 -bottom-10 h-32 w-32 rounded-full bg-gold-2/20 transition-transform duration-500 group-hover:scale-125" />
                  <span className="relative z-[1] font-display text-lg font-extrabold sm:text-xl">{category}</span>
                  <b className="relative z-[1] text-gold-2">Shop now</b>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
