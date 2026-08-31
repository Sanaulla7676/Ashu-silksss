import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SWEEP_MS = 760;
const EASE = [0.65, 0, 0.35, 1];

const copy = {
  login: {
    kicker: 'Ashu Silks',
    title: 'Welcome',
    titleEm: 'back.',
    text: 'Your saved sarees, cart and orders are exactly where you left them.',
  },
  signup: {
    kicker: 'Ashu Silks',
    title: 'Join',
    titleEm: 'Ashu Silks.',
    text: 'Save your favourites, track orders and check out faster next time.',
  },
};

function DecorativePanel({ mode }) {
  const c = copy[mode];
  return (
    <div className="relative flex h-full min-h-[220px] flex-col justify-center overflow-hidden bg-gradient-to-br from-wine to-wine-2 p-7 text-white sm:min-h-[480px] sm:p-10">
      <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-gold/25" />
      <span className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full border border-gold/15" />
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="relative z-10"
        >
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-gold-2">{c.kicker}</span>
          <h2 className="mt-3 font-display text-3xl leading-[1.05] sm:text-4xl">
            {c.title} <em className="text-gold-2 not-italic sm:italic">{c.titleEm}</em>
          </h2>
          <p className="mt-4 max-w-[300px] text-[0.9rem] leading-relaxed text-white/80">{c.text}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Auth() {
  const { user, signIn, signUp, resetPassword, firebaseReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  // 'idle' | 'covering' (blade sliding in to fully hide the card) | 'revealing' (sliding on out)
  const [sweepPhase, setSweepPhase] = useState('idle');
  const [pendingMode, setPendingMode] = useState(null);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const destination = location.state?.from || '/orders';

  if (user) return <Navigate to={destination} replace />;

  const switchMode = next => {
    if (sweepPhase !== 'idle' || next === mode) return;
    setError('');
    setDirection(next === 'signup' ? 1 : -1);
    setPendingMode(next);
    setSweepPhase('covering');
  };

  // Each leg of the sweep completes for real (tied to the animation itself,
  // not a guessed timeout) before the next leg or the content swap happens —
  // so this can never desync under tab throttling, slow devices, etc.
  const onBladeLegComplete = () => {
    if (sweepPhase === 'covering') {
      setMode(pendingMode);
      setSweepPhase('revealing');
    } else if (sweepPhase === 'revealing') {
      setSweepPhase('idle');
    }
  };

  const submit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await signIn(form.email, form.password);
      else await signUp(form.name, form.email, form.password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err?.message?.replace('Firebase: ', '') || 'Unable to continue.');
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (!form.email) { setError('Enter your email above first, then tap "Forgot password?" again.'); return; }
    try {
      await resetPassword(form.email);
      toast.success(`Password reset email sent to ${form.email}`);
    } catch (err) {
      setError(err?.message?.replace('Firebase: ', '') || 'Could not send reset email.');
    }
  };

  const isFormLeft = mode === 'login';

  const SignInForm = (
    <>
      <h3 className="font-display text-2xl text-ink">Sign in</h3>
      <div className="mt-5 grid gap-3.5">
        <label className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-ink/15 bg-paper pl-3 pr-2.5 sm:gap-2.5 sm:pl-3.5 sm:pr-3 transition-shadow focus-within:border-wine focus-within:ring-2 focus-within:ring-wine/20">
          <Mail size={16} className="shrink-0 text-muted" />
          <input
            required type="email" placeholder="Email address" value={form.email} autoComplete="email"
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full min-w-0 bg-transparent py-3 text-[0.92rem] outline-none placeholder:text-muted sm:py-3.5 sm:text-base"
          />
        </label>
        <label className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-ink/15 bg-paper pl-3 pr-2.5 sm:gap-2.5 sm:pl-3.5 sm:pr-3 transition-shadow focus-within:border-wine focus-within:ring-2 focus-within:ring-wine/20">
          <Lock size={16} className="shrink-0 text-muted" />
          <input
            required type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} autoComplete="current-password"
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full min-w-0 bg-transparent py-3 text-[0.92rem] outline-none placeholder:text-muted sm:py-3.5 sm:text-base"
          />
          <button type="button" onClick={() => setShowPassword(s => !s)} className="shrink-0 text-muted" aria-label={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </label>
        <div className="flex flex-col gap-2 text-[0.8rem] sm:flex-row sm:items-center sm:justify-between sm:text-[0.82rem]">
          <label className="flex items-center gap-1.5 text-muted">
            <input type="checkbox" defaultChecked /> Keep me signed in
          </label>
          <button type="button" onClick={forgotPassword} className="text-left font-semibold text-wine hover:underline">Forgot password?</button>
        </div>
      </div>
      {error && <p className="mt-3 font-bold text-danger">{error}</p>}
      <button className="btn-primary mt-5 w-full" disabled={busy || !firebaseReady}>
        <LogIn size={18} /> {busy ? 'Please wait...' : 'Sign in'}
      </button>
      <p className="mt-4 text-center text-[0.86rem] text-muted">
        New to Ashu Silks? <button type="button" onClick={() => switchMode('signup')} className="font-bold text-wine hover:underline">Create an account</button>
      </p>
    </>
  );

  const SignUpForm = (
    <>
      <h3 className="font-display text-2xl text-ink">Create account</h3>
      <div className="mt-5 grid gap-3.5">
        <label className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-ink/15 bg-paper pl-3 pr-2.5 sm:gap-2.5 sm:pl-3.5 sm:pr-3 transition-shadow focus-within:border-wine focus-within:ring-2 focus-within:ring-wine/20">
          <User size={16} className="shrink-0 text-muted" />
          <input
            required placeholder="Full name" value={form.name} autoComplete="name"
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full min-w-0 bg-transparent py-3 text-[0.92rem] outline-none placeholder:text-muted sm:py-3.5 sm:text-base"
          />
        </label>
        <label className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-ink/15 bg-paper pl-3 pr-2.5 sm:gap-2.5 sm:pl-3.5 sm:pr-3 transition-shadow focus-within:border-wine focus-within:ring-2 focus-within:ring-wine/20">
          <Mail size={16} className="shrink-0 text-muted" />
          <input
            required type="email" placeholder="Email address" value={form.email} autoComplete="email"
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full min-w-0 bg-transparent py-3 text-[0.92rem] outline-none placeholder:text-muted sm:py-3.5 sm:text-base"
          />
        </label>
        <label className="flex items-center gap-2 rounded-[var(--radius-btn)] border border-ink/15 bg-paper pl-3 pr-2.5 sm:gap-2.5 sm:pl-3.5 sm:pr-3 transition-shadow focus-within:border-wine focus-within:ring-2 focus-within:ring-wine/20">
          <Lock size={16} className="shrink-0 text-muted" />
          <input
            required minLength={6} type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} autoComplete="new-password"
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full min-w-0 bg-transparent py-3 text-[0.92rem] outline-none placeholder:text-muted sm:py-3.5 sm:text-base"
          />
          <button type="button" onClick={() => setShowPassword(s => !s)} className="shrink-0 text-muted" aria-label={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </label>
        <p className="-mt-1.5 text-[0.76rem] text-muted">Use 6 characters or more.</p>
      </div>
      {error && <p className="mt-3 font-bold text-danger">{error}</p>}
      <button className="btn-primary mt-5 w-full" disabled={busy || !firebaseReady}>
        <UserPlus size={18} /> {busy ? 'Please wait...' : 'Create account'}
      </button>
      <p className="mt-4 text-center text-[0.86rem] text-muted">
        Already have an account? <button type="button" onClick={() => switchMode('login')} className="font-bold text-wine hover:underline">Sign in</button>
      </p>
    </>
  );

  return (
    <section className="pb-16 pt-6 md:pb-24 md:pt-10">
      <div className="container max-w-[880px]">
        {!firebaseReady && (
          <div className="mb-4 rounded-lg border border-gold/40 bg-gold-2/20 p-3.5 text-sm text-wine-2">
            Firebase authentication is not configured yet. Add the production VITE_FIREBASE_* values before enabling accounts.
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl border border-ink/10 shadow-[var(--shadow-lift)]">
          <div className="grid grid-cols-2">
            {isFormLeft ? (
              <>
                <div><form onSubmit={submit} className="bg-paper p-5 sm:p-10">{mode === 'login' ? SignInForm : SignUpForm}</form></div>
                <div><DecorativePanel mode={mode} /></div>
              </>
            ) : (
              <>
                <div><DecorativePanel mode={mode} /></div>
                <div><form onSubmit={submit} className="bg-paper p-5 sm:p-10">{mode === 'login' ? SignInForm : SignUpForm}</form></div>
              </>
            )}
          </div>

          {/* Diagonal blade sweep — covers the card while the two sides swap places.
              Driven entirely by onAnimationComplete, not a guessed timeout, so the
              content swap always lands exactly when the blade has actually finished
              covering the card, even under tab throttling or a slow device. */}
          {sweepPhase !== 'idle' && (
            <motion.div
              className="pointer-events-none absolute inset-y-[-15%] z-30 w-[85%] -skew-x-[16deg]"
              style={{
                background: 'linear-gradient(100deg, transparent, var(--color-gold) 6%, var(--color-wine-2) 16%, var(--color-wine) 50%, var(--color-wine-2) 84%, var(--color-gold) 94%, transparent)',
              }}
              initial={{ left: direction === 1 ? '-95%' : '110%' }}
              animate={{
                left: sweepPhase === 'covering'
                  ? '7.5%'
                  : (direction === 1 ? '110%' : '-95%'),
              }}
              transition={{ duration: SWEEP_MS / 2000, ease: EASE }}
              onAnimationComplete={onBladeLegComplete}
            />
          )}
        </div>

        <p className="mt-4 text-center text-[0.78rem] text-muted">Switch states to send the blade across — both forms validate for real.</p>
      </div>
    </section>
  );
}
