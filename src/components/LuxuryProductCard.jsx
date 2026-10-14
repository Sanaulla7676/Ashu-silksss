import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, Check, Eye } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import toast from 'react-hot-toast';
import ProductMedia from './ProductMedia';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useImagePalette } from '../hooks/useImagePalette';
import { money, mediaUrl, mediaUrls, discountPercent, productImage } from '../utils';

const EASE = [0.22, 1, 0.36, 1];

export const cardReveal = {
  hidden: { opacity: 0, y: 54, filter: 'blur(7px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
};

// Editorial lines shown over the photo, chosen by what the saree is for.
const TAGLINES = {
  'Kanjeevaram Silk': ['A heritage', 'that lives', 'forever'],
  Bridal: ['Made', 'for your', 'special days'],
  Designer: ['Grace', 'in every', 'occasion'],
  Cotton: ['Simplicity', 'that never', 'fades'],
  'Tissue Silk': ['Soft', 'like a', 'story'],
  default: ['Woven', 'with', 'intent'],
};

const taglineFor = product => TAGLINES[product.category] || TAGLINES.default;

function subtitleFor(product) {
  const parts = [product.fabric, product.workType || product.pattern].filter(Boolean);
  if (parts.length) return parts.join(' Â· ');
  if (product.occasion) return product.occasion;
  return 'Pure silk Â· Handwo¶»§q«^