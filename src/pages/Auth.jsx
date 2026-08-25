import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { user, signIn, signUp, firebaseReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const destination = location.state?.from || '/orders';

  if (user) return <Navigate to={destination} replace />;

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

  return (
    <>
      <Breadcrumbs items={[{ label: mode === 'login' ? 'Sign in' : 'Create account' }]} />
      <section className="pb-16 pt-2 md:pb-24">
        <div className="container max-w-[560px]">
          <div className="mb-5">
            <span className="eyebrow">Ashu Silks Account</span>
            <h2 className="heading-xl text-[clamp(1.8rem,4vw,2.6rem)]">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p className="text-muted">Use your account to securely view orders and checkout history.</p>
          </div>
          {!firebaseReady && (
            <div className="mb-4 rounded border border-gold/40 bg-gold-2/20 p-3.5 text-sm text-wine-2">
              Firebase authentication is not configured yet. Add the production VITE_FIREBASE_* values before enabling customer accounts.
            </div>
          )}
          <motion.form
            className="card-surface grid gap-3 p-5 sm:p-6"
            onSubmit={submit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {mode === 'signup' && <input className="field" required placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />}
            <input className="field" required type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input className="field" required minLength={6} type="password" placeholder="Password (6+ characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            {error && <p className="font-bold text-danger">{error}</p>}
            <button className="btn-primary" disabled={busy || !firebaseReady}>
              {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </motion.form>
          <button
            className="btn-ghost mt-3 w-full"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Create a new account' : 'I already have an account'}
          </button>
        </div>
      </section>
    </>
  );
}
