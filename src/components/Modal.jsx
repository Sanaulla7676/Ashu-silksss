import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Modal({ title, children, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] grid place-items-center bg-ink/55 p-4 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="max-h-[92vh] w-[min(720px,100%)] overflow-auto rounded-md bg-ivory shadow-[var(--shadow-lift)]"
          onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="flex items-center justify-between border-b border-ink/10 p-4 sm:p-5">
            <b className="font-display text-ink">{title}</b>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="p-5 sm:p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
