import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronRight, ChevronDown, Heart, ShoppingBag, X, SlidersHorizontal,
  Leaf, Truck, ShieldCheck, PackageCheck, Headphones, ImageOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import DualRangeSlider from '../components/DualRangeSlider';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { money, mediaUrl, mediaUrls, discountPercent, productImage } from '../utils';

const PAGE_SIZE = 12;
const EASE = [0.22, 1, 0.36, 1];

const COLOR_SWATCHES = [
  { name: 'Red', hex: '#c0392b' }, { name: 'Pink', hex: '#e08fb8' },
  { name: 'Purple', hex: '#7b3fa0' }, { name: 'Blue', hex: '#2f6fbe' },
  { name: 'Green', hex: '#3e8e5a' }, { name: 'Gold', hex: '#C89A3D' },
  { name: 'Orange', hex: '#d9822b' }, { name: 'Beige', hex: '#dcc9a3' },
  { name: 'White', hex: '#ffffff' }, { name: 'Black', hex: '#1a1a1a' },
];

const trustBar = [
  { icon: Leaf, title: '100% Pure Silk', text: 'Certified Authentic' },
  { icon: Truck, title: 'Fast Delivery', text: 'Bengaluru 2 days Â· India 7 days' },
  { icon: ShieldCheck, title: 'Secure Payment', text: '100% Protected' },
  { icon: PackageCheck, title: 'Easy Returns', ¶»§q«^