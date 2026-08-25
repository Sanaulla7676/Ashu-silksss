import { useState } from 'react';
import { Upload, RotateCcw, Image as ImageIcon, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { useHero } from '../context/HeroContext';
import { uploadHeroMedia, cloudinaryReady } from '../services/cloudinary';

export default function AdminHero() {
  const { hero, saveHero, resetHero } = useHero();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const chooseFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const result = await uploadHeroMedia(file);
      await saveHero(result);
      toast.success('Hero updated — live on the homepage now');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const reset = async () => {
    await resetHero();
    toast.success('Hero reset to default');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">Hero Content</h1>
        <p className="text-sm text-slate-500">The image or video at the very top of your homepage. Changes go live for every visitor immediately after upload.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-1 font-semibold text-slate-900">Current hero</h2>
          <p className="mb-4 text-sm text-slate-500">{hero.type === 'video' ? 'Video' : 'Image'} · what's live right now</p>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {hero.type === 'video' ? (
              <video className="aspect-video w-full object-cover" src={hero.url} muted autoPlay loop playsInline />
            ) : (
              <img className="aspect-video w-full object-cover" src={hero.url} alt="Homepage hero" />
            )}
          </div>
          <button className="dash-btn-ghost mt-4" onClick={reset}><RotateCcw size={16} /> Reset to default</button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-1 font-semibold text-slate-900">Upload new hero</h2>
          <p className="mb-4 text-sm text-slate-500">JPG, PNG or WEBP images (max 8 MB), or MP4/WEBM video (max 60 MB).</p>

          {!cloudinaryReady && (
            <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-700">Cloudinary is not configured — uploads are disabled.</p>
          )}
          {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <label className={`flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 p-6 text-center ${cloudinaryReady ? 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40' : 'cursor-not-allowed opacity-50'}`}>
              <ImageIcon size={22} className="text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">Upload image</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading || !cloudinaryReady} onChange={chooseFile} />
            </label>
            <label className={`flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 p-6 text-center ${cloudinaryReady ? 'cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/40' : 'cursor-not-allowed opacity-50'}`}>
              <Video size={22} className="text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">Upload video</span>
              <input type="file" accept="video/mp4,video/webm,video/quicktime" hidden disabled={uploading || !cloudinaryReady} onChange={chooseFile} />
            </label>
          </div>
          {uploading && <p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><Upload size={14} className="animate-pulse" /> Uploading...</p>}
        </div>
      </div>
    </div>
  );
}
