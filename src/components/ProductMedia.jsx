import { Sparkles } from 'lucide-react';

export default function ProductMedia({ url, className = '' }) {
  if (!url) {
    return (
      <div className={`grid h-full w-full place-items-center bg-gold-2/20 text-gold ${className}`}>
        <Sparkles size={48} strokeWidth={1.25} className="opacity-40" />
      </div>
    );
  }

  const video = /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('/video/upload/');
  const base = `h-full w-full object-cover ${className}`;

  if (video) {
    return <video className={base} src={url} muted playsInline loop autoPlay />;
  }

  return <img className={base} src={url} alt="" loading="lazy" decoding="async" />;
}
