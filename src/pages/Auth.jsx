import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
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
      <section className="section page-section">
        <div className="container" style={{ maxWidth: 560 }}>
          <div className="section-head">
            <span className="eyebrow">Ashu Silks Account</span>
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>Use your account to securely view orders and checkout history.</p>
          </div>
          {!firebaseReady && <div className="notice">Firebase authentication is not configured yet. Add the production VITE_FIREBASE_* values before enabling customer accounts.</div>}
          <form className="form checkout-card" onSubmit={submit}>
            {mode === 'signup' && <input required placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />}
            <input required type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input required minLength={6} type="password" placeholder="Password (6+ characters)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            {error && <p className="error-text">{error}</p>}
            <button className="btn primary" disabled={busy || !firebaseReady}>
              {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <button className="btn ghost" style={{ marginTop: 12, width: '100%' }} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Create a new account' : 'I already have an account'}
          </button>
        </div>
      </section>
    </>
  );
}
