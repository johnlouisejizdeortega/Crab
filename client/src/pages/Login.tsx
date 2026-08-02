import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { CrabLogo } from '../components/icons';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('rider@crab.dev');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'DRIVER' ? '/drive' : '/ride');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 font-extrabold text-2xl mb-6">
          <CrabLogo size={34} className="text-brand-500" /> Crab
        </Link>
        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <h1 className="text-xl font-bold">Welcome back</h1>
          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="label">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-sm text-center text-slate-500">
            New to Crab?{' '}
            <Link to="/register" className="text-brand-600 font-semibold">
              Create an account
            </Link>
          </p>
        </form>
        <div className="mt-4 text-center text-xs text-slate-400">
          Try <button className="underline" onClick={() => { setEmail('rider@crab.dev'); setPassword('password123'); }}>rider@crab.dev</button>
          {' or '}
          <button className="underline" onClick={() => { setEmail('driver@crab.dev'); setPassword('password123'); }}>driver@crab.dev</button>
        </div>
      </div>
    </div>
  );
}
