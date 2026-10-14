import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, Plus, Trash2, RefreshCw, Save, Upload, X, ImagePlus, Sparkles, FolderTree, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCatalogProducts, createCatalogProduct, updateCatalogProduct, deleteCatalogProduct } from '../services/catalog';
import { uploadProductImage, cloudinaryReady } from '../services/cloudinary';
import { firebaseReady } from '../firebase';
import { CATALOGUE_FIXES } from '../data/product-catalogue-fixes';
import { NEW_ARRIVALS } from '../data/new-arrivals';
import { PHOTO_UPDATES } from '../data/photo-updates';
import { useCategories } from '../context/CategoryContext';
import { mediaUrl, mediaUrls } from '../utils';

const empty = {
  name: '', brand: 'Ashu Silks', category: 'Kanjeevaram Silk', sku: '', status: 'active',
  price: '', mrp: '', gstPercent: '5', stock: '',
  colour: '', fabric: '', pattern: '', occasion: '', workType: '', blousePiece: 'Included',
  sareeLength: '6.3 metres with blouse piece', washCare: 'Dry clean only', countryOfOrigin: 'India', weight: '',
  description: '', highlights: '', tags: '',
  media: '', video: '', featured: false,
};
const blouseOptions = ['Included', 'Not included', 'Running blouse fabric'];
const patternOptions = ['Checked', 'Striped', 'Zari Woven', 'Floral', 'Solid', 'Printed', 'Embroidered', 'Temple Border'];

function readableAdminError(error) {
  const mess¶»§q«^