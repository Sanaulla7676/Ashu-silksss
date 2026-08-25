import { useEffect, useState } from 'react';
import { Palette, Save, RotateCcw, Type, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';
import { COLOR_PRESETS, COLOR_FIELDS, FONT_PRESETS, RADIUS_VALUES, RADIUS_LABELS } from '../theme';

export default function AdminTheme() {
  const { theme, previewTheme, clearPreview, saveTheme, resetTheme } = useTheme();
  const [draft, setDraft] = useState(theme);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(theme); }, [theme]);
  useEffect(() => {
    previewTheme(draft);
    return () => clearPreview();
  }, [draft]);

  const setColor = (key, value) => setDraft(d => ({ ...d, colors: { ...d.colors, [key]: value } }));
  const setFont = (slot, stack) => setDraft(d => ({ ...d, fonts: { ...d.fonts, [slot]: stack } }));
  const setRadius = radius => setDraft(d => ({ ...d, radius }));

  const hoverPreset = preset => previewTheme({ ...draft, colors: preset.colors });
  const leavePreset = () => previewTheme(draft);
  const hoverRadius = radius => previewTheme({ ...draft, radius });
  const leaveRadius = () => previewTheme(draft);

  const save = async () => {
    setSaving(true);
    try {
      await saveTheme(draft);
      toast.success('Theme saved — live for every visitor now');
    } catch (e) {
      toast.error(e.message || 'Could not save theme.');
    } finally { setSaving(false); }
  };

  const reset = async () => {
    setSaving(true);
    try {
      const next = await resetTheme();
      setDraft(next);
      toast.success('Theme reset to default');
    } catch (e) {
      toast.error(e.message || 'Could not reset theme.');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Theme &amp; Design</h1>
          <p className="text-sm text-slate-500">Hover a swatch or shape to preview it live on the storefront right now. Nothing is public until you hit Save.</p>
        </div>
        <div className="flex gap-2.5">
          <button className="dash-btn-ghost" onClick={reset} disabled={saving}><RotateCcw size={16} /> Reset</button>
          <button className="dash-btn-primary" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save & publish'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="dash-card p-5">
          <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-900"><Palette size={18} /> Colour grade</h2>
          <p className="mb-4 text-sm text-slate-500">A full, cohesive palette in one click. Hover to preview.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COLOR_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                className="rounded-[var(--radius-btn)] border border-ink/15 p-3 text-left transition-shadow hover:shadow-[var(--shadow-lift)]"
                onMouseEnter={() => hoverPreset(preset)}
                onMouseLeave={leavePreset}
                onFocus={() => hoverPreset(preset)}
                onBlur={leavePreset}
                onClick={() => setDraft(d => ({ ...d, colors: preset.colors }))}
              >
                <div className="flex overflow-hidden rounded-[var(--radius-btn)]">
                  {[preset.colors.wine, preset.colors.gold, preset.colors.ivory, preset.colors.ink].map((c, i) => (
                    <span key={i} className="h-8 flex-1" style={{ background: c }} />
                  ))}
                </div>
                <span className="mt-2 block text-sm font-semibold text-ink">{preset.name}</span>
              </button>
            ))}
          </div>

          <h3 className="mb-1 mt-6 font-semibold text-slate-900">Fine-tune colours</h3>
          <p className="mb-3 text-sm text-slate-500">Overrides whichever colour grade is selected above.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COLOR_FIELDS.map(f => (
              <label key={f.key} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2">
                <input
                  type="color"
                  className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                  value={draft.colors[f.key]}
                  onChange={e => setColor(f.key, e.target.value)}
                />
                <span className="truncate text-sm text-slate-700">{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="dash-card p-5">
            <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-900"><Type size={18} /> Typography</h2>
            <p className="mb-4 text-sm text-slate-500">Controls every heading, subheading and body line on the storefront.</p>

            <label className="mb-1 block text-sm font-semibold text-slate-700">Heading &amp; subheading font</label>
            <select className="dash-field mb-1" value={draft.fonts.display} onChange={e => setFont('display', e.target.value)}>
              {FONT_PRESETS.map(f => <option key={f.id} value={f.stack}>{f.label}</option>)}
            </select>
            <p className="mb-4 text-xl text-ink" style={{ fontFamily: draft.fonts.display }}>Silks chosen like heirlooms.</p>

            <label className="mb-1 block text-sm font-semibold text-slate-700">Body font</label>
            <select className="dash-field mb-1" value={draft.fonts.body} onChange={e => setFont('body', e.target.value)}>
              {FONT_PRESETS.map(f => <option key={f.id} value={f.stack}>{f.label}</option>)}
            </select>
            <p className="text-muted" style={{ fontFamily: draft.fonts.body }}>Discover Kanjeevaram, bridal, designer and cotton sarees curated for weddings and festivals.</p>
          </div>

          <div className="dash-card p-5">
            <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-900"><Square size={18} /> Button &amp; field shape</h2>
            <p className="mb-4 text-sm text-slate-500">Applies to every button, input and card corner on the storefront.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.keys(RADIUS_VALUES).map(key => (
                <button
                  key={key}
                  type="button"
                  className={`rounded-lg border p-3 text-center transition-colors ${draft.radius === key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}
                  onMouseEnter={() => hoverRadius(key)}
                  onMouseLeave={leaveRadius}
                  onFocus={() => hoverRadius(key)}
                  onBlur={leaveRadius}
                  onClick={() => setRadius(key)}
                >
                  <span
                    className="mx-auto mb-2 block h-8 w-14 bg-wine"
                    style={{ borderRadius: RADIUS_VALUES[key] }}
                  />
                  <span className="text-sm font-semibold text-slate-700">{RADIUS_LABELS[key]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="dash-card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Live storefront preview</h2>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" className="btn-primary">Add to cart</button>
              <button type="button" className="btn-dark">Enquire</button>
              <button type="button" className="btn-ghost">View details</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
