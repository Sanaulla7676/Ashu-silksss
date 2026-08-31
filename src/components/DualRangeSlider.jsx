const thumbClass = [
  'pointer-events-none absolute inset-x-0 top-1/2 h-5 w-full -translate-y-1/2 appearance-none bg-transparent',
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3',
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2',
  '[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.35)]',
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full',
  '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-gold',
].join(' ');

export default function DualRangeSlider({ min, max, step = 500, value, onChange }) {
  const [lo, hi] = value;
  const pct = v => ((v - min) / (max - min)) * 100;

  return (
    <div className="relative h-3">
      <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-ink/10" />
      <div
        className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-gold"
        style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
      />
      <input
        type="range" min={min} max={max} step={step} value={lo}
        onChange={e => onChange([Math.min(Number(e.target.value), hi - step), hi])}
        className={thumbClass}
        aria-label="Minimum price"
      />
      <input
        type="range" min={min} max={max} step={step} value={hi}
        onChange={e => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
        className={thumbClass}
        aria-label="Maximum price"
      />
    </div>
  );
}
