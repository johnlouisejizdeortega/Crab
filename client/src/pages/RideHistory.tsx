import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { money, km, timeAgo, STATUS_LABEL, STATUS_COLOR } from '../lib/format';
import { MapIcon, MapPin, Coins, Zap } from '../components/icons';
import type { Ride } from '../types';

export default function RideHistory() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ rides: Ride[] }>('/rides')
      .then((d) => setRides(d.rides))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl w-full px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Your rides</h1>
      <p className="text-slate-500 text-sm mb-6">
        {user?.role === 'DRIVER' ? 'Trips you’ve driven' : 'Trips you’ve taken'}
      </p>

      {loading ? (
        <p className="text-slate-400">Loading…</p>
      ) : rides.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400">
            <MapIcon size={28} />
          </div>
          <p className="mt-3">No rides yet. Your trips will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((r) => {
            const other = user?.role === 'DRIVER' ? r.rider : r.driver;
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className={`pill ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                </div>
                <div className="mt-3 flex justify-between items-end">
                  <div className="text-sm text-slate-600 space-y-1">
                    <p className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                      {r.pickup.label.split(',').slice(0, 2).join(',')}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin size={14} className="text-brand-500 shrink-0" />
                      {r.drop.label.split(',').slice(0, 2).join(',')}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                      {r.model === 'BID' ? <Coins size={12} /> : <Zap size={12} />}
                      {km(r.distanceKm)} · {r.model === 'BID' ? 'Named price' : 'Fixed'}
                      {other ? ` · ${other.name}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold">
                      {money(r.agreedFare ?? r.fixedFare ?? r.offerFare)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
