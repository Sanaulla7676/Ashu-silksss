import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CloudUpload, FolderOpen, Image, LoaderCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firebaseReady } from '../firebase';
import { createCatalogProduct, getCatalogProducts, updateCatalogProduct } from '../services/catalog';
import { cloudinaryReady, uploadProductImage } from '../services/cloudinary';
import { mediaUrls } from '../utils';
import { VISUAL_PRODUCT_DETAILS } from '../data/product-names-2026-10-15';

const BATCH = 'import-2026-10-15';
const IMAGE_PATH = /(?:^|\/)Products\/(Product_\d{3})\/([^/]+\.(?:jpe?g|png|webp|avif))$/i;

function getPhoto(file) {
  const path = file.webkitRelativePath || file.name || '';
  const match = path.match(IMAGE_PATH);
  if (!match) return null;
  return { productId: match[1], name: match[2], file };
}

function skuFor(productId) {
  const number = Number(String(productId).replace('Product_', ''));
  return 'AS-IMP-20261015-' + String(number).padStart(3, '0');
}

function sortByPhotoName(a, b) {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
}

export default function AdminBulkImport() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ totalImages: 0, uploadedImages: 0, savedProducts: 0, skippedProducts: 0 });
  const [summary, setSummary] = useState('');
  const [errors, setErrors] = useState([]);
  const [finished, setFinished] = useState(false);

  const imageCount = useMemo(() => groups.reduce((sum, group) => sum + group.files.length, 0), [groups]);

  const chooseFolder = event => {
    const photos = Array.from(event.target.files || []).map(getPhoto).filter(Boolean);
    const byProduct = new Map();
    for (const photo of photos) {
      if (!byProduct.has(photo.productId)) byProduct.set(photo.productId, []);
      byProduct.get(photo.productId).push(photo);
    }
    const next = Array.from(byProduct.entries())
      .map(([id, files]) => ({ id, files: files.sort(sortByPhotoName) }))
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    setGroups(next);
    setSummary('');
    setErrors([]);
    setFinished(false);
    setProgress({ totalImages: photos.length, uploadedImages: 0, savedProducts: 0, skippedProducts: 0 });
    if (!photos.length) {
      setSummary('No product photos found. Extract the ZIP, then select the Saree_Categorized_Package or Products folder. Product images must remain inside Product_001, Product_002, and similar folders.');
    }
    event.target.value = '';
  };

  const startImport = async () => {
    if (busy) return;
    if (!user) { setSummary('Sign in to the store-owner admin account before importing.'); return; }
    if (!firebaseReady) { setSummary('Firebase is not configured in this deployment.'); return; }
    if (!cloudinaryReady) { setSummary('The new Cloudinary account is not configured in the storefront.'); return; }
    if (!groups.length) { setSummary('Choose the extracted product folder first.'); return; }

    setBusy(true);
    setSummary('Checking the existing catalogue…');
    setErrors([]);
    let uploadedImages = 0;
    let savedProducts = 0;
    let skippedProducts = 0;
    const failures = [];

    try {
      const existing = await getCatalogProducts();
      const bySku = new Map(existing.filter(product => product.sku).map(product => [product.sku, product]));
      const todo = [];

      for (const group of groups) {
        const current = bySku.get(skuFor(group.id));
        const currentMedia = current ? mediaUrls(current) : [];
        const alreadyImported = Boolean(
          current &&
          current.sourceBatch === BATCH &&
          currentMedia.length === group.files.length &&
          currentMedia.every(url => url.includes('/ashu-silks/products/' + BATCH + '/' + group.id + '/'))
        );
        if (alreadyImported) {
          skippedProducts += 1;
          continue;
        }
        todo.push(group);
      }

      const totalImages = todo.reduce((sum, group) => sum + group.files.length, 0);
      setProgress({ totalImages, uploadedImages: 0, savedProducts: 0, skippedProducts });
      setSummary('Uploading ' + totalImages + ' photos to Cloudinary with the new account…');

      const urlsByProduct = new Map(todo.map(group => [group.id, Array(group.files.length).fill('')]));
      const queue = [];
      for (const group of todo) {
        group.files.forEach((photo, index) => queue.push({ group, photo, index }));
      }

      let nextIndex = 0;
      const worker = async () => {
        while (true) {
          const itemIndex = nextIndex;
          nextIndex += 1;
          if (itemIndex >= queue.length) return;
          const item = queue[itemIndex];
          try {
            const publicId = 'photo-' + String(item.index + 1).padStart(2, '0');
            const url = await uploadProductImage(
              item.photo.file,
              BATCH + '/' + item.group.id,
              publicId
            );
            urlsByProduct.get(item.group.id)[item.index] = url;
            uploadedImages += 1;
            setProgress(current => ({ ...current, uploadedImages }));
            setSummary('Uploading photos: ' + uploadedImages + ' of ' + totalImages + ' completed…');
          } catch (error) {
            failures.push(item.group.id + ' / ' + item.photo.name + ': ' + (error.message || 'Upload failed'));
          }
        }
      };

      await Promise.all(Array.from({ length: 3 }, () => worker()));

      for (const group of todo) {
        const urls = urlsByProduct.get(group.id) || [];
        if (!urls.length || urls.some(url => !url)) {
          failures.push(group.id + ': not published because one or more photos failed to upload. Re-run the import after fixing the upload issue.');
          continue;
        }

        const number = String(Number(group.id.replace('Product_', ''))).padStart(3, '0');
        const sku = skuFor(group.id);
        const visual = VISUAL_PRODUCT_DETAILS[group.id] || { name: 'Ashu Silks Saree ' + number, colour: '' };
        const productData = {
          name: visual.name,
          brand: 'Ashu Silks',
          category: 'New Arrivals',
          sku,
          status: 'active',
          price: 0,
          mrp: 0,
          priceOnRequest: true,
          stock: 0,
          stockOnRequest: true,
          gstPercent: 5,
          colour: visual.colour,
          fabric: '',
          pattern: '',
          occasion: '',
          workType: '',
          blousePiece: '',
          sareeLength: '',
          washCare: '',
          description: visual.name + '. The product name and colour are visual descriptions based on the supplied photo. The archive does not verify fibre content, weave technique, zari composition, dimensions or price. Please confirm these details and current availability with Ashu Silks before purchase.',
          highlights: ['New arrival from Ashu Silks', 'Visual colour and style description', 'Price and product specifications confirmed on enquiry'],
          tags: ['new arrival', 'saree', BATCH, group.id.toLowerCase()],
          media: urls,
          featured: false,
          sourceBatch: BATCH,
          sourceProductId: group.id,
        };

        try {
          const current = bySku.get(sku);
          if (current) {
            await updateCatalogProduct(current.id, productData);
          } else {
            const created = await createCatalogProduct(productData);
            bySku.set(sku, { id: created.id, ...productData });
          }
          savedProducts += 1;
          setProgress(current => ({ ...current, savedProducts }));
        } catch (error) {
          failures.push(group.id + ': photos uploaded but catalogue save failed. ' + (error.message || 'Save failed'));
        }
      }

      setProgress(current => ({ ...current, savedProducts, skippedProducts }));
      setErrors(failures.slice(0, 24));
      setSummary(
        'Import finished: ' + savedProducts + ' product records saved, ' +
        skippedProducts + ' already-imported products skipped, ' +
        failures.length + ' issue(s).'
      );
      setFinished(true);
    } catch (error) {
      setSummary(error.message || 'The import could not start. Check the admin account, Firebase, and Cloudinary configuration.');
      setErrors(failures.slice(0, 24));
    } finally {
      setBusy(false);
    }
  };

  const percent = progress.totalImages
    ? Math.round((progress.uploadedImages / progress.totalImages) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
          <CloudUpload size={15} /> Catalogue migration
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">Bulk import sarees</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Upload the grouped product photos to the replacement Cloudinary account and create or update their catalogue records in one run. Existing products outside this import batch are left untouched.
        </p>
      </div>

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle size={19} className="mt-0.5 shrink-0" />
        <div>
          <b>Names are photo-based descriptions, not factory catalogue data.</b>
          <p className="mt-1 leading-5">
            The ZIP uses IDs such as Product_001 instead of supplied product names or prices. Descriptive names and colour labels have been prepared from the visible photos to make the storefront easier to browse. They do not certify fibre content, weaving technique or zari composition. Prices remain “Price on request”; confirm each product’s exact specifications and stock before taking orders.
          </p>
        </div>
      </div>

      <div className="dash-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <FolderOpen size={21} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">1. Choose the extracted product folder</h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Extract Saree_Products_Categorized.zip in Windows. Select the Saree_Categorized_Package folder, or its Products subfolder. The importer ignores contact sheets and videos.
              </p>
            </div>
          </div>
          <label htmlFor="ashu-product-folder" className="dash-btn-primary shrink-0 cursor-pointer">
            <FolderOpen size={16} /> Select folder
          </label>
          <input
            id="ashu-product-folder"
            className="hidden"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={chooseFolder}
            {...{ webkitdirectory: '' }}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500"><Image size={16} /> Photos selected</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{imageCount}</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Product groups</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{groups.length}</div>
          </div>
          <div className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-1">
            <div className="text-sm text-slate-500">Target Cloudinary folder</div>
            <div className="mt-2 break-all text-sm font-semibold text-slate-800">ashu-silks/products/{BATCH}/Product_001</div>
          </div>
        </div>

        {groups.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Detected products</h3>
              <span className="text-xs text-slate-500">Showing first 12 of {groups.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {groups.slice(0, 12).map(group => (
                <div key={group.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-800">{group.id}</span>
                  <span className="text-slate-500">{group.files.length} photo{group.files.length === 1 ? '' : 's'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {busy && (
          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-indigo-950">
              <span className="flex items-center gap-2"><LoaderCircle size={16} className="animate-spin" /> Uploading and publishing</span>
              <span>{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-indigo-100">
              <div className="h-full rounded-full bg-indigo-600 transition-[width]" style={{ width: percent + '%' }} />
            </div>
            <p className="mt-2 text-xs text-indigo-800">
              {progress.uploadedImages}/{progress.totalImages} images uploaded · {progress.savedProducts} product records saved
            </p>
          </div>
        )}

        {summary && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
            {finished ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <RefreshCw size={18} className="mt-0.5 shrink-0 text-indigo-600" />}
            <p>{summary}</p>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="mb-2 text-sm font-bold text-red-900">Items needing attention</h3>
            <ul className="grid gap-1.5 text-xs leading-5 text-red-800">
              {errors.map((error, index) => <li key={index}>{error}</li>)}
            </ul>
            {errors.length >= 24 && <p className="mt-2 text-xs text-red-800">Only the first 24 issues are shown.</p>}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-5 text-slate-500">
            Uploads use short-lived server signatures. The Cloudinary API secret stays on the server, never in the browser bundle. Import can be safely rerun; already completed products are skipped.
          </p>
          <button
            type="button"
            className="dash-btn-primary shrink-0"
            onClick={startImport}
            disabled={busy || !groups.length || !user || !firebaseReady || !cloudinaryReady}
          >
            {busy ? <LoaderCircle size={16} className="animate-spin" /> : <CloudUpload size={16} />}
            {busy ? 'Importing…' : '2. Upload photos & publish products'}
          </button>
        </div>
      </div>
    </div>
  );
}
