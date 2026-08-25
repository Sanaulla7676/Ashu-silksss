import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductMedia from './ProductMedia';

export default function ProductGallery({ media = [], badge }) {
  const images = media.length ? media : [''];
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1 });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-md bg-gold-2/25 shadow-[var(--shadow-lift)]">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {images.map((url, i) => (
              <div className="min-w-0 flex-[0_0_100%]" key={i}>
                <div className="aspect-[3/4] w-full">
                  <ProductMedia url={url} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {badge}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-wine shadow-[var(--shadow-soft)]"
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-wine shadow-[var(--shadow-soft)]"
              onClick={() => emblaApi?.scrollNext()}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${i === selected ? 'w-6 bg-wine' : 'w-2 bg-ink/15'}`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
