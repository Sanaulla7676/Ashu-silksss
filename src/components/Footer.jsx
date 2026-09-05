import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, MessageCircle, Camera, Globe, Send, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { storeInfo } from '../data';

const EASE = [0.22, 1, 0.36, 1];

const reveal = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const linkClass =
  'group inline-flex items-start gap-2 text-[13px] text-white/70 transition-colors duration-300 hover:text-gold-2';

function FooterLink({ to, children }) {
  return (
    <Link className={linkClass} to={to}>
      <span className="relative">
        {children}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gold-2 transition-all duration-300 group-hover:w-full" />
      </span>
    </Link>
  );
}

const socials = [
  { Icon: Camera, label: 'Instagram' },
  { Icon: Globe, label: 'Facebook' },
  { Icon: Send, label: 'Message us' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-wine-2 text-white">
      {/* Ambient glow */}
      <div className="as-drift pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div
        className="as-float pointer-events-none absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-gold-2/[0.07] blur-3xl"
        style={{ animationDelay: '2s' }}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="container relative grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]"
      >
        <motion.div variants={reveal}>
          <div className="font-display text-[26px] font-medium tracking-[0.12em] text-white">ASHU SILKS</div>
          <div className="mt-1.5 text-[8px] uppercase tracking-[0.34em] text-gold-2">Draped in Tradition</div>
          <p className="mt-4 max-w-[300px] text-[13px] leading-[1.8] text-white/65">
            Celebrating India's rich textile heritage with timeless elegance and thoughtful craftsmanship.
          </p>
          <div className="mt-6 flex gap-2.5">
            {socials.map(({ Icon, label }) => (
              <a
                key={label}
                href={`https://wa.me/${storeInfo.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/70 transition-all duration-300 hover:-translate-y-1 hover:border-gold-2 hover:bg-gold-2/10 hover:text-gold-2"
              >
                <Icon size={15} />
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div variants={reveal}>
          <h4 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-gold-2">Shop</h4>
          <div className="flex flex-col gap-3">
            <FooterLink to="/products">All Sarees</FooterLink>
            <FooterLink to="/products/Kanjeevaram Silk">Kanjeevaram</FooterLink>
            <FooterLink to="/products/Bridal">Bridal</FooterLink>
            <FooterLink to="/products/Designer">Designer</FooterLink>
            <FooterLink to="/products/Cotton">Cotton</FooterLink>
          </div>
        </motion.div>

        <motion.div variants={reveal}>
          <h4 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-gold-2">Customer Care</h4>
          <div className="flex flex-col gap-3">
            <FooterLink to="/cart">Cart</FooterLink>
            <FooterLink to="/wishlist">Wishlist</FooterLink>
            <FooterLink to="/orders">Orders</FooterLink>
            <FooterLink to="/contact">Enquire</FooterLink>
            <FooterLink to="/about">Our Story</FooterLink>
          </div>
        </motion.div>

        <motion.div variants={reveal}>
          <h4 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-gold-2">Visit</h4>
          <div className="flex flex-col gap-3">
            <p className="flex items-start gap-2 text-[13px] text-white/70">
              <Phone size={14} className="mt-1 shrink-0 text-gold-2" /> {storeInfo.phone}
            </p>
            <p className="flex items-start gap-2 text-[13px] text-white/70">
              <Clock size={14} className="mt-1 shrink-0 text-gold-2" /> {storeInfo.hours}
            </p>
            <p className="flex items-start gap-2 text-[13px] leading-[1.7] text-white/70">
              <MapPin size={14} className="mt-1 shrink-0 text-gold-2" /> {storeInfo.address}
            </p>
            <a
              className="as-shine mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-[12px] font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
              href={`https://wa.me/${storeInfo.whatsapp}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={14} /> WhatsApp us
            </a>
          </div>
        </motion.div>
      </motion.div>

      <div className="container relative flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-[11px] text-white/45 sm:flex-row">
        <span>© {new Date().getFullYear()} {storeInfo.name}. All rights reserved.</span>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group inline-flex items-center gap-2 transition-colors hover:text-gold-2"
        >
          Back to top
          <span className="grid h-7 w-7 place-items-center rounded-full border border-white/20 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-gold-2">
            <ArrowUp size={13} />
          </span>
        </button>
      </div>
    </footer>
  );
}
