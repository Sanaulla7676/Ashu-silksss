import { useEffect, useState } from 'react';
import { Palette, Save, RotateCcw, Type, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AdminNav from '../components/AdminNav';
import { COLOR_PRESETS, COLOR_FIELDS, FONT_PRESETS, RADIUS_VALUES, RADIUS_LABELS } from '../theme';

function EmptyPage({ title, text }) {
  return (
    <section className="py-16 md:py-24">
      <div className="container rounded-md border border-dashed border-ink/15 bg-paper p-10 text-center text-muted">
        <h2 className="font-display text-ink">{title}</h2>
        {text && <p className="mt-2">{text}</p>}
      </div>
    </section>
  );
}

export default function AdminTheme() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState(false);
  const { theme, previewTheme, clearPreview, saveTheme, resetTheme } = useTheme();
  const [draft, setDraft] = useState(theme);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) user.getIdTokenResult(true).then(r => setAdmin(r.claims.admin === true)).catch(() => setAdmin(false));
  }, [user]);

  useEffect(() => { setDraft(theme); }, [theme]);
  useEffect(() => {
    previewTheme(draft);
    return () => clearPreview();
  }, [draft]);

  if (loading) return <EmptyPage title="Loading admin..." />;
  if (!user) return <EmptyPage title="Admin sign-in required" />;
  if (!admin) return <EmptyPage title="Access denied" text="Your Firebase account does not have the admin claim." />;

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
    <section className="pb-16 pt-2 md:pb-24">
      <div className="container">
        <AdminNav />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="eyebrow">Ashu Silks</span>
            <h2 className="heading-xl text-[clamp(1.8rem,4vw,2.6rem)]">Theme &amp; Design</h2>
            <p className="text-muted">Hover a swatch or shape to preview it live on the site right now. Nothing is public until you hit Save.</p>
          </div>
          <div className="flex gap-2.5">
            <button className="btn-ghost" onClick={reset} disabled={saving}><RotateCcw size={16} /> Reset</button>
            <button className="btn-primary" onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save & publish'}</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card-surface p-5 sm:p-6">
            <h3 className="mb-1 flex items-center gap-2 text-ink"><Palette size={20} /> Colour grade</h3>
            <p className="mb-4 text-sm text-muted">A full, cohesive palette in one click. Hover to preview.</p>
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

            <h3 className="mb-1 mt-6 text-ink">Fine-tune colours</h3>
            <p className="mb-3 text-sm text-muted">Overrides whichever colour grade is selected above.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {COLOR_FIELDS.map(f => (
                <label key={f.key} className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-ink/15 p-2">
                  <input
                    type="color"
                    className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                    value={draft.colors[f.key]}
                    onChange={e => setColor(f.key, e.target.value)}
                  />
                  <span className="truncate text-sm text-ink">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="card-surface p-5 sm:p-6">
              <h3 className="mb-1 flex items-center gap-2 text-ink"><Type size={20} /> Typography</h3>
              <p className="mb-4 text-sm text-muted">Controls every heading, subheading and body line on the site.</p>

              <label className="mb-1 block text-sm font-semibold text-ink">Heading &amp; subheading font</label>
              <select className="field mb-1" value={draft.fonts.display} onChange={e => setFont('display', e.target.value)}>
                {FONT_PRESETS.map(f => <option key={f.id} value={f.stack}>{f.label}</option>)}
              </select>
              <p className="mb-4 text-xl" style={{ fontFamily: draft.fonts.display }}>Silks chosen like heirlooms.</p>

              <label className="mb-1 block text-sm font-semibold text-ink">Body font</label>
              <select className="field mb-1" value={draft.fonts.body} onChange={e => setFont('body', e.target.value)}>
                {FONT_PRESETS.map(f => <option key={f.id} value={f.stack}>{f.label}</option>)}
              </select>
              <p className="text-muted" style={{ fontFamily: draft.fonts.body }}>Discover Kanjeevaram, bridal, designer and cotton sarees curated for weddings and festivals.</p>
            </div>

            <div className="card-surface p-5 sm:p-6">
              <h3 className="mb-1 flex items-center gap-2 text-ink"><Square size={20} /> Button &amp; field shape</h3>
              <p className="mb-4 text-sm text-muted">Applies to every button, input and card corner across the site.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.keys(RADIUS_VALUES).map(key => (
                  <button
                    key={key}
                    type="button"
                    className={`rounded-[var(--radius-btn)] border p-3 text-center transition-colors ${draft.radius === key ? 'border-wine bg-wine/5' : 'border-ink/15'}`}
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
                    <span className="text-sm font-semibold text-ink">{RADIUS_LABELS[key]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card-surface p-5 sm:p-6">
              <h3 className="mb-3 text-ink">Live preview</h3>
              <div className="flex flex-wrap gap-2.5">
                <button type="button" className="btn-primary">Add to cart</button>
                <button type="button" className="btn-dark">Enquire</button>
                <button type="button" className="btn-ghost">View details</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
