import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import ProductMedia from './ProductMedia';
import { isVideoMedia } from '../utils';

export default function ProductGallery({ media = [], badge, productName = '', colour = '', imageIndex, imageIndexes = [] }) {
  const indexedCandidates = Array.isArray(imageIndexes) ? imageIndexes : [];
  const validIndexes = [...new Set(indexedCandidates.map(Number).filter(
    index => Number.isInteger(index) && index >= 0 && index < 192
  ))];
  const fallbackIndexes = validIndexes.length
    ? validIndexes
    : (imageIndex !== undefined && Number.isInteger(Number(imageIndex)) && Number(imageIndex) >= 0
      ? [Number(imageIndex)]
      : []);

  const mediaItems = media
    .filter(url => typeof url === 'string' && url.trim())
    .map((url, i) => ({ url, imageIndex: undefined, key: `media-${i}-${url}` }));
  const uploadedPhotoCount = mediaItems.filter(item => !isVideoMedia(item.url)).length;
  const supplementalItems = fallbackIndexes.slice(uploadedPhotoCount)
    .map(index => ({ url: '', imageIndex: index, key: `atlas-${index}` }));
  const combinedItems = [...mediaItems, ...supplementalItems];
  const images = combinedItems.length
    ? combinedItems
    : [{ url: '', imageIndex, key: 'placeholder' }];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1 });
  const [selected, setSelected] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    setSelected(0);
    emblaApi?.scrollTo(0, true);
  }, [emblaApi, images.length]);

  const activeImage = images[Math.min(selected, images.length - 1)] || images[0];

  return (
    <div>
      <div className="relative overflow-hidden rounded-md bg-gold-2/25 shadow-[var(--shadow-lift)]">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {images.map(({ url, imageIndex: tileIndex, key }) => (
              <div className="min-w-0 flex-[0_0_100%]" key={key}>
                <div className="aspect-[3/4] w-full">
                  <ProductMedia url={url} productName={productName} colour={colour} imageIndex={tileIndex ?? imageIndex} priority={i === selected} imageWidth={1200} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {badge}
        <button
          type="button"
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-wine shadow-[var(--shadow-soft)]"
          onClick={() => setZoomOpen(true)}
          aria-label="Zoom product photo"
          title="View larger photo"
        >
          <ZoomIn size={18} />
        </button>
        {images.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-wine shadow-[var(--shadow-soft)]"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-wine shadow-[var(--shadow-soft)]"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Product photo thumbnails">
          {images.map(({ url, imageIndex: tileIndex, key }, i) => (
            <button
              type="button"
              key={key}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`w-[58px] shrink-0 overflow-hidden rounded border-2 transition-colors sm:w-[68px] ${i === selected ? 'border-wine' : 'border-ink/10 hover:border-wine/50'}`}
              aria-label={`Show product photo ${i + 1}`}
              aria-current={i === selected ? 'true' : undefined}
            >
              <div className="aspect-[3/4]">
                <ProductMedia url={url} productName={productName} colour={colour} imageIndex={tileIndex ?? imageIndex} />
              </div>
            </button>
          ))}
        </div>
      )}

      {zoomOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-3 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Larger product photo: ${productName}`}
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-ink"
            onClick={() => setZoomOpen(false)}
            aria-label="Close enlarged photo"
          >
            <X size={20} />
          </button>
          <div className="h-[82vh] max-w-[92vw] aspect-[3/4]" onClick={event => event.stopPropagation()}>
            <ProductMedia
              url={activeImage.url}
              productName={productName}
              colour={colour}
              imageIndex={activeImage.imageIndex ?? imageIndex}
              className="!object-contain"
            />
          </div>
          <p className="mt-3 text-sm text-white/90">Photo {selected + 1} of {images.length}</p>
        </div>
      )}
    </div>
  );
}
