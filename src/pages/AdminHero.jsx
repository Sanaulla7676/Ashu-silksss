import { useEffect, useState } from 'react';
import { Upload, RotateCcw, Image as ImageIcon, Video, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useHero, DEFAULT_HERO, BUTTON_STYLES } from '../context/HeroContext';
import { uploadHeroMedia, cloudinaryReady } from '../services/cloudinary';

export default function AdminHero() {
  const { hero, saveHero, resetHero } = useHero();
  const [draft, setDraft] = useState(hero);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setDraft(hero); }, [hero]);

  const set = (key, value) => setDraft(d => ({ ...d, [key]: value }));

  const chooseFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const result = await uploadHeroMedia(file);
      setDraft(d => ({ ...d, ...result }));
      toast.success('Media ready — click Save to publish');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addButton = () => {
    setDraft(d => ({ ...d, buttons: [...(d.buttons || []), { label: '', link: '/products', style: 'primary' }] }));
  };
  const updateButton = (i, key, value) => {
    setDraft(d => ({ ...d, buttons: d.buttons.map((b, idx) => idx === i ? { ...b, [key]: value } : b) }));
  };
  const removeButton = i => {
    setDraft(d => ({ ...d, buttons: d.buttons.filter((_, idx) => idx !== i) }));
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      await saveHero(draft);
      toast.success('Hero updated — live on the homepage now');
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const reset = async () => {
    await resetHero();
    setDraft(DEFAULT_HERO);
    toast.success('Hero reset to default');
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Hero Content</h1>
          <p className="text-sm text-slate-500">Design the top of your homepage — media, headline, text and buttons. Nothing goes live until you hit Save.</p>
        </div>
        <div className="flex gap-2.5">
          <button className="dash-btn-ghost" onClick={reset} disabled={saving}><RotateCcw size={16} /> Reset to default</button>
          <button className="dash-btn-primary" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save & publish'}</button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="grid content-start gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-1 font-semibold text-slate-900">Background media</h2>
            <p className="mb-4 text-sm text-slate-500">JPG, PNG or WEBP images (max 8 MB), or MP4/WEBM video (max 60 MB).</p>

            {!cloudinaryReady && (
              <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-700">Cloudinary is not configured — uploads are disabled.</p>
            )}

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

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Text</h2>
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Eyebrow (small kicker above headline)
                <input className="dash-field" placeholder="e.g. Ashu Silks · Pure Silk" value={draft.eyebrow || ''} onChange={e => set('eyebrow', e.target.value)} />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Headline
                  <input className="dash-field" placeholder="e.g. Drape in" value={draft.headline || ''} onChange={e => set('headline', e.target.value)} />
                </label>
                <label className="grid gap-1 text-sm font-semibold text-slate-700">
                  Headline accent (highlighted in gold)
                  <input className="dash-field" placeholder="e.g. timeless silk." value={draft.headlineAccent || ''} onChange={e => set('headlineAccent', e.target.value)} />
                </label>
              </div>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Subtext
                <textarea className="dash-field min-h-20" placeholder="A line or two under the headline" value={draft.subtext || ''} onChange={e => set('subtext', e.target.value)} />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Buttons</h2>
              <button type="button" className="dash-btn-ghost" onClick={addButton} disabled={(draft.buttons || []).length >= 3}><Plus size={16} /> Add button</button>
            </div>
            <div className="grid gap-3">
              {(draft.buttons || []).map((btn, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
                  <input className="dash-field" placeholder="Button label" value={btn.label} onChange={e => updateButton(i, 'label', e.target.value)} />
                  <input className="dash-field" placeholder="Link — e.g. /products or https://..." value={btn.link} onChange={e => updateButton(i, 'link', e.target.value)} />
                  <select className="dash-field" value={btn.style} onChange={e => updateButton(i, 'style', e.target.value)}>
                    {BUTTON_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <button type="button" className="dash-btn-danger" onClick={() => removeButton(i)} aria-label="Remove button"><Trash2 size={16} /></button>
                </div>
              ))}
              {!(draft.buttons || []).length && <p className="text-sm text-slate-500">No buttons — the hero will show text only.</p>}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Live preview</h2>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-wine-3 sm:aspect-video">
              {draft.type === 'video' ? (
                <video className="absolute inset-0 h-full w-full object-cover" src={draft.url} muted autoPlay loop playsInline />
              ) : (
                <img className="absolute inset-0 h-full w-full object-cover" src={draft.url} alt="Hero preview" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,7,15,.82)_0%,rgba(23,15,15,.42)_45%,rgba(23,15,15,.08)_100%),linear-gradient(0deg,rgba(15,7,10,.7)_0%,transparent_38%)]" />
              <div className="absolute inset-x-4 bottom-4 max-w-[85%] text-white">
                {draft.eyebrow && (
                  <span className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gold-2">{draft.eyebrow}</span>
                )}
                <h3 className="font-display text-xl font-bold italic leading-tight sm:text-2xl">
                  {draft.headline} {draft.headlineAccent && <span className="text-gold-2">{draft.headlineAccent}</span>}
                </h3>
                {draft.subtext && <p className="mt-1.5 line-clamp-2 text-xs text-white/80">{draft.subtext}</p>}
                {(draft.buttons || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {draft.buttons.map((b, i) => (
                      <span
                        key={i}
                        className={`rounded px-2.5 py-1.5 text-[0.65rem] font-bold ${
                          b.style === 'link' ? 'border-b border-white/60 text-white' :
                          b.style === 'ghost' ? 'border border-white/60 text-white' :
                          b.style === 'dark' ? 'bg-ink text-white' :
                          'bg-wine text-white'
                        }`}
                      >
                        {b.label || 'Button'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Approximate preview — actual spacing and type size differ slightly on the live site.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
