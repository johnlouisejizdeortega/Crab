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
    <div className="mx-auto max-w-2xl w-full px-4 py-6">
      <h1 className="text-xl font-bold mb-0.5">Your rides</h1>
      <p className="text-neutral-500 text-[13px] mb-5">
        {user?.role === 'DRIVER' ? 'Trips you’ve driven' : 'Trips you’ve taken'}
      </p>

      {loading ? (
        <p className="text-neutral-400">Loading…</p>
      ) : rides.length === 0 ? (
        <div className="card p-8 text-center text-neutral-500">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-neutral-400">
            <MapIcon size={24} />
          </div>
          <p className="mt-3 text-[13px]">No rides yet. Your trips will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rides.map((r) => {
            const other = user?.role === 'DRIVER' ? r.rider : r.driver;
            return (
              <div key={r.id} className="card p-3.5">
                <div className="flex items-center justify-between">
                  <span className={`pill ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  <span className="text-[11px] text-neutral-400">{timeAgo(r.createdAt)}</span>
                </div>
                <div className="mt-2.5 flex justify-between items-end">
                  <div className="text-[13px] text-neutral-600 space-y-1">
                    <p className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      {r.pickup.label.split(',').slice(0, 2).join(',')}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin size={13} className="text-neutral-400 shrink-0" />
                      {r.drop.label.split(',').slice(0, 2).join(',')}
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                      {r.model === 'BID' ? <Coins size={12} /> : <Zap size={12} />}
                      {km(r.distanceKm)} · {r.model === 'BID' ? 'Named price' : 'Fixed'}
                      {other ? ` · ${other.name}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold tabular-nums">
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
