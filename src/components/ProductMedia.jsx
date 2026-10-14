import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { productImage } from '../utils';

export default function ProductMedia({ url, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  if (!url || failed) {
    return (
      <div className={`grid h-full w-full place-items-center bg-gold-2/20 text-gold ${className}`}>
        <Sparkles size={48} strokeWidth={1.25} className="opacity-40" />
      </div>
    );
  }

  const video = /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('/video/upload/');
  const base = `h-full w-full object-cover ${className}`;

  if (video) {
    return <video className={base} src={url} muted playsInline loop autoPlay onError={() => setFailed(true)} />;
  }

  return <img className={base} src={productImage(url)} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}
