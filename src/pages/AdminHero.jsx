import { useEffect, useRef, useState } from 'react';
import { Upload, RotateCcw, Image as ImageIcon, Video, Save, Plus, Trash2, Move, Eraser } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useHero, DEFAULT_HERO, BUTTON_STYLES, BUTTON_SHAPES, BUTTON_SIZES,
  normalizeButton, heroButtonClass,
} from '../context/HeroContext';
import { uploadHeroMedia, cloudinaryReady } from '../services/cloudinary';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export default function AdminHero() {
  const { hero, saveHero, resetHero } = useHero();
  const [draft, setDraft] = useState(hero);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const previewRef = useRef(null);
  const dragKey = useRef(null);

  useEffect(() => { setDraft(hero); }, [hero]);

  const set = (key, value) => setDraft(d => ({ ...d, [key]: value }));
  const setPos = (key, axis, value) => setDraft(d => ({ ...d, [key]: { ...(d[key] || DEFAULT_HERO[key]), [axis]: clamp(Number(value) || 0, 0, 88) } }));

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
    setDraft(d => ({ ...d, buttons: [...(d.buttons || []), normalizeButton({ label: 'New button' })] }));
  };
  const updateButton = (i, key, value) => {
    setDraft(d => ({ ...d, buttons: d.buttons.map((b, idx) => idx === i ? { ...b, [key]: value } : b) }));
  };
  const clearButtonColors = i => {
    setDraft(d => ({ ...d, buttons: d.buttons.map((b, idx) => idx === i ? { ...b, bg: '', color: '' } : b) }));
  };
  const removeButton = i => {
    setDraft(d => ({ ...d, buttons: d.buttons.filter((_, idx) => idx !== i) }));
  };

  const startDrag = key => e => {
    e.preventDefault();
    dragKey.current = key;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDrag = e => {
    if (!dragKey.current || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 88);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 88);
    const key = dragKey.current === 'text' ? 'textPosition' : 'buttonsPosition';
    setDraft(d => ({ ...d, [key]: { x, y } }));
  };
  const endDrag = () => { dragKey.current = null; };

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

  const tPos = draft.textPosition || DEFAULT_HERO.textPosition;
  const bPos = draft.buttonsPosition || DEFAULT_HERO.buttonsPosition;
  const align = draft.textAlign || 'left';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Hero Content</h1>
          <p className="text-sm text-slate-500">Design the top of your homepage — media, text, buttons and where everything sits. Nothing goes live until you hit Save.</p>
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

              <div className="mt-1 border-t border-slate-100 pt-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500"><Move size={13} /> Text position</p>
                <div className="grid grid-cols-3 gap-3">
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    X (%)
                    <input className="dash-field" type="number" min="0" max="88" value={Math.round(tPos.x)} onChange={e => setPos('textPosition', 'x', e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Y (%)
                    <input className="dash-field" type="number" min="0" max="88" value={Math.round(tPos.y)} onChange={e => setPos('textPosition', 'y', e.target.value)} />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Align
                    <select className="dash-field" value={align} onChange={e => set('textAlign', e.target.value)}>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">Or drag the text block directly in the preview →</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Buttons</h2>
              <button type="button" className="dash-btn-ghost" onClick={addButton} disabled={(draft.buttons || []).length >= 3}><Plus size={16} /> Add button</button>
            </div>
            <p className="mb-3 text-xs text-slate-500">This position also carries the small "100% Pure Silk / Handpicked / Secure" trust row that sits under your buttons.</p>
            <div className="mb-4 grid grid-cols-2 gap-3 border-b border-slate-100 pb-4">
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Row X (%)
                <input className="dash-field" type="number" min="0" max="88" value={Math.round(bPos.x)} onChange={e => setPos('buttonsPosition', 'x', e.target.value)} />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-600">
                Row Y (%)
                <input className="dash-field" type="number" min="0" max="88" value={Math.round(bPos.y)} onChange={e => setPos('buttonsPosition', 'y', e.target.value)} />
              </label>
            </div>
            <div className="grid gap-3">
              {(draft.buttons || []).map((rawBtn, i) => {
                const btn = normalizeButton(rawBtn);
                return (
                  <div key={i} className="grid gap-2.5 rounded-lg border border-slate-200 p-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input className="dash-field" placeholder="Button label" value={btn.label} onChange={e => updateButton(i, 'label', e.target.value)} />
                      <input className="dash-field" placeholder="Link — e.g. /products or https://..." value={btn.link} onChange={e => updateButton(i, 'link', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <select className="dash-field" value={btn.style} onChange={e => updateButton(i, 'style', e.target.value)}>
                        {BUTTON_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                      <select className="dash-field" value={btn.shape} onChange={e => updateButton(i, 'shape', e.target.value)} disabled={btn.style === 'link'}>
                        {BUTTON_SHAPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                      <select className="dash-field" value={btn.size} onChange={e => updateButton(i, 'size', e.target.value)}>
                        {BUTTON_SIZES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                      <label className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 px-2.5 text-sm text-slate-700">
                        <input type="checkbox" checked={btn.showIcon !== false} disabled={btn.style === 'link'} onChange={e => updateButton(i, 'showIcon', e.target.checked)} /> Icon
                      </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        Background
                        <input type="color" className="h-7 w-8 cursor-pointer rounded border border-slate-300 bg-transparent p-0" value={btn.bg || '#5E0715'} onChange={e => updateButton(i, 'bg', e.target.value)} disabled={btn.style === 'link'} />
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        Text colour
                        <input type="color" className="h-7 w-8 cursor-pointer rounded border border-slate-300 bg-transparent p-0" value={btn.color || '#ffffff'} onChange={e => updateButton(i, 'color', e.target.value)} />
                      </label>
                      {(btn.bg || btn.color) && (
                        <button type="button" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline" onClick={() => clearButtonColors(i)}>
                          <Eraser size={12} /> Use style default
                        </button>
                      )}
                      <button type="button" className="dash-btn-danger ml-auto" onClick={() => removeButton(i)} aria-label="Remove button"><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })}
              {!(draft.buttons || []).length && <p className="text-sm text-slate-500">No buttons — the hero will show text only.</p>}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-1 font-semibold text-slate-900">Live preview</h2>
            <p className="mb-4 text-sm text-slate-500">Drag the labelled blocks to reposition text and buttons.</p>
            <div
              ref={previewRef}
              className="relative aspect-[4/5] w-full touch-none overflow-hidden rounded-lg bg-wine-3 sm:aspect-video"
            >
              {draft.type === 'video' ? (
                <video className="absolute inset-0 h-full w-full object-cover" src={draft.url} muted autoPlay loop playsInline />
              ) : (
                <img className="absolute inset-0 h-full w-full object-cover" src={draft.url} alt="Hero preview" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,7,15,.82)_0%,rgba(23,15,15,.42)_45%,rgba(23,15,15,.08)_100%),linear-gradient(0deg,rgba(15,7,10,.7)_0%,transparent_38%)]" />

              <div
                className={`absolute max-w-[70%] cursor-move select-none rounded border border-dashed border-white/30 p-1.5 text-white hover:border-indigo-400 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}
                style={{ left: `${tPos.x}%`, top: `${tPos.y}%` }}
                onPointerDown={startDrag('text')}
                onPointerMove={onDrag}
                onPointerUp={endDrag}
              >
                <span className="mb-1 inline-block rounded bg-indigo-600 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-white">Text · drag me</span>
                {draft.eyebrow && (
                  <span className="block text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gold-2">{draft.eyebrow}</span>
                )}
                <h3 className="font-display text-lg font-bold italic leading-tight sm:text-xl">
                  {draft.headline} {draft.headlineAccent && <span className="text-gold-2">{draft.headlineAccent}</span>}
                </h3>
                {draft.subtext && <p className="mt-1 line-clamp-2 text-xs text-white/80">{draft.subtext}</p>}
              </div>

              <div
                className={`absolute max-w-[70%] cursor-move select-none rounded border border-dashed border-white/30 p-1.5 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}
                style={{ left: `${bPos.x}%`, top: `${bPos.y}%` }}
                onPointerDown={startDrag('buttons')}
                onPointerMove={onDrag}
                onPointerUp={endDrag}
              >
                <span className="mb-1 inline-block rounded bg-indigo-600 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide text-white">Buttons · drag me</span>
                {(draft.buttons || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {draft.buttons.map((b, i) => (
                      <span
                        key={i}
                        className={`pointer-events-none text-[0.6rem] ${heroButtonClass(b)}`}
                        style={{ backgroundColor: b.style !== 'link' ? (b.bg || undefined) : undefined, color: b.color || undefined, padding: b.style === 'link' ? undefined : '0.35rem 0.65rem', minHeight: 0 }}
                      >
                        {b.label || 'Button'}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-[0.55rem] text-white/60">+ trust row</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Approximate preview — actual spacing and type size differ slightly on the live site.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
