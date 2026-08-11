import { Star } from 'lucide-react';

export default function ProductMedia({ url, className = '' }) {
  if (!url) {
    return (
      <div className="placeholder">
        <Star size={64} opacity={0.2} />
      </div>
    );
  }

  const video = /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('/video/upload/');

  if (video) {
    return <video className={className} src={url} muted playsInline loop autoPlay />;
  }

  return <img className={className} src={url} alt="" loading="lazy" />;
}
