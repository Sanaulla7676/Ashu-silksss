import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, ShoppingBag, Star, Truck, ShieldCheck, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Breadcrumbs from '../components/Breadcrumbs';
import Modal from '../components/Modal';
import ProductGrid from '../components/ProductGrid';
import ProductGallery from '../components/ProductGallery';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { fetchLiveProduct, fetchLiveProducts } from '../services/liveCatalog';
import { createEnquiry } from '../services/firestore';
import { generateEnquiryMessage, generateWhatsAppLink } from '../services/whatsapp';
import { discountPercent, mediaUrls, money } from '../utils';

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
      if¶»§q«^