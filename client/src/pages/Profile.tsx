import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import Stars from '../components/Stars';
import type { User } from '../types';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [vModel, setVModel] = useState(user?.driver?.vehicleModel ?? '');
  const [vPlate, setVPlate] = useState(user?.driver?.plate ?? '');
  const [vColor, setVColor] = useState(user?.driver?.color ?? '');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const isDriver = user.role === 'DRIVER';

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      const { user: updated } = await api.patch<{ user: User }>('/users/me', {
        name,
        phone,
        vehicle: isDriver ? { model: vModel, plate: vPlate, color: vColor } : undefined,
      });
      setUser(updated);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg w-full px-4 py-8">
      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-brand-100 grid place-items-center text-3xl">
          {isDriver ? '🧑‍✈️' : '🧍'}
        </div>
        <div>
          <h1 className="text-xl font-bold">{user.name}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <Stars value={user.ratingAvg} size={14} count={user.ratingCount} />
            <span className="pill bg-slate-100 text-slate-600">{user.role}</span>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-bold">Edit profile</h2>
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        {isDriver && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-600">Vehicle</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Model</label>
                <input className="input" value={vModel} onChange={(e) => setVModel(e.target.value)} />
              </div>
              <div>
                <label className="label">Plate</label>
                <input className="input" value={vPlate} onChange={(e) => setVPlate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Color</label>
              <input className="input" value={vColor} onChange={(e) => setVColor(e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-emerald-600">✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}
