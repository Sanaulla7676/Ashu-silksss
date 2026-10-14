import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Heart, ArrowRight, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ProductMedia from './ProductMedia';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { money, mediaUrls, discountPercent } from '../utils';

const EASE = [0.22, 1, 0.36, 1];

export default function QuickViewModal({ product, onClose }) {
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => { setActive(0); setAdded(false); }, [product?.id]);

  // Close on Escape and stop the page behind from scrolling.
  useEffect(() => {
    if (!product) return undefined;
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [product, onClose]);

  const gallery = product && Array.isArray(product.media) && product.media.length
    ? product.media.filter(Boolean)
    : product ? mediaUrls(product) : [];
  const discount = product ? discountPercent(product.price, p¶»§q«^