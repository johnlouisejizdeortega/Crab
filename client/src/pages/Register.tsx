import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { CrabLogo, Car, SteeringWheel } from '../components/icons';
import type { Role } from '../types';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<Role>((params.get('role') as Role) === 'DRIVER' ? 'DRIVER' : 'RIDER');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vModel: '',
    vPlate: '',
    vColor: 'Black',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role,
        vehicle:
          role === 'DRIVER'
            ? { model: form.vModel, plate: form.vPlate, color: form.vColor }
            : undefined,
      });
      navigate(user.role === 'DRIVER' ? '/drive' : '/ride');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 font-extrabold text-2xl mb-6">
          <CrabLogo size={34} className="text-brand-500" /> Crab
        </Link>
        <form onSubmit={onSubmit} className="card p-6 space-y-4">
          <h1 className="text-xl font-bold">Create your account</h1>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            {(['RIDER', 'DRIVER'] as Role[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${
                  role === r ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                }`}
              >
                {r === 'RIDER' ? <Car size={18} /> : <SteeringWheel size={18} />}
                {r === 'RIDER' ? 'Ride' : 'Drive'}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="label">Full name</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="optional" />
            </div>
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} minLength={6} required />
          </div>

          {role === 'DRIVER' && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-600">Vehicle details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Model</label>
                  <input className="input" value={form.vModel} onChange={set('vModel')} placeholder="Toyota Vios" required />
                </div>
                <div>
                  <label className="label">Plate</label>
                  <input className="input" value={form.vPlate} onChange={set('vPlate')} placeholder="ABC-123" required />
                </div>
              </div>
              <div>
                <label className="label">Color</label>
                <input className="input" value={form.vColor} onChange={set('vColor')} />
              </div>
            </div>
          )}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Creating…' : `Create ${role === 'DRIVER' ? 'driver' : 'rider'} account`}
          </button>
          <p className="text-sm text-center text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
