import { useEffect, useState, ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { money, timeAgo, STATUS_LABEL, STATUS_COLOR } from '../lib/format';
import Stars from '../components/Stars';
import {
  Search,
  MapPin,
  Car,
  Coins,
  History,
  Wallet,
  UserRound,
  ChevronRight,
  Zap,
  IconProps,
} from '../components/icons';
import type { Ride } from '../types';

interface Tile {
  label: string;
  to: string;
  Icon: ComponentType<IconProps>;
  accent?: boolean;
}

const TILES: Tile[] = [
  { label: 'Ride', to: '/book', Icon: Car, accent: true },
  { label: 'Name price', to: '/book?mode=bid', Icon: Coins, accent: true },
  { label: 'History', to: '/history', Icon: History },
  { label: 'Wallet', to: '/wallet', Icon: Wallet },
];

export default function RiderDashboard() {
  const { user } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    api
      .get<{ rides: Ride[] }>('/rides')
      .then((d) => setRides(d.rides.slice(0, 4)))
      .catch(() => {});
  }, []);

  const first = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="min-h-full pb-8">
      {/* Orange header band */}
      <div className="bg-brand-500 text-white px-5 pt-9 pb-16 rounded-b-[1.75rem]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-[13px]">Good to see you,</p>
            <h1 className="text-xl font-bold">{first}</h1>
          </div>
          <Link
            to="/profile"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/20 backdrop-blur"
            aria-label="Profile"
          >
            <UserRound size={20} />
          </Link>
        </div>

        <Link
          to="/book"
          className="mt-4 flex items-center gap-2.5 bg-white rounded-full px-4 py-3 text-neutral-400"
        >
          <Search size={18} />
          <span className="text-[15px]">Where to?</span>
        </Link>

        <div className="mt-3 flex items-center gap-1.5 text-white/90 text-[13px]">
          <MapPin size={14} />
          <span>Metro Manila · tap search to set pickup</span>
        </div>
      </div>

      {/* Service grid (overlapping the band) */}
      <div className="px-5 -mt-10">
        <div className="card p-4">
          <div className="grid grid-cols-4 gap-2">
            {TILES.map((t) => (
              <Link key={t.label} to={t.to} className="flex flex-col items-center gap-1.5 py-1 active:scale-95 transition">
                <span
                  className={`app-chip h-12 w-12 ${
                    t.accent ? 'bg-brand-50 text-brand-600' : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <t.Icon size={22} />
                </span>
                <span className="text-[11px] font-medium text-neutral-700 text-center leading-tight">
                  {t.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick cards */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        <Link to="/wallet" className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-[12px]">
            <Wallet size={15} /> Wallet
          </div>
          <p className="mt-1.5 text-2xl font-bold tabular-nums">{money(user?.wallet?.balance ?? 0)}</p>
        </Link>
        <Link to="/profile" className="card p-4">
          <div className="flex items-center gap-2 text-neutral-500 text-[12px]">
            <UserRound size={15} /> Your rating
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold tabular-nums">{(user?.ratingAvg ?? 5).toFixed(1)}</span>
            <Stars value={user?.ratingAvg ?? 5} size={13} />
          </div>
        </Link>
      </div>

      {/* Promo */}
      <div className="px-5 mt-4">
        <Link to="/book" className="card p-4 flex items-center gap-3.5">
          <span className="app-chip h-11 w-11 bg-neutral-900 text-white shrink-0">
            <Zap size={20} />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-[15px]">Two ways to ride</p>
            <p className="text-[13px] text-neutral-500">Lock a fixed fare, or name your own price.</p>
          </div>
          <ChevronRight size={18} className="text-neutral-400 shrink-0" />
        </Link>
      </div>

      {/* Recent rides */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-[13px] font-semibold text-neutral-500 uppercase tracking-wide">Recent</h2>
          {rides.length > 0 && (
            <Link to="/history" className="text-[13px] font-medium text-brand-600">
              See all
            </Link>
          )}
        </div>

        {rides.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-[13px] text-neutral-500">No rides yet.</p>
            <Link to="/book" className="btn-primary mt-3 inline-flex">
              Book your first ride
            </Link>
          </div>
        ) : (
          <div className="list-group divide-y divide-black/[0.06]">
            {rides.map((r) => (
              <Link key={r.id} to="/history" className="list-row">
                <span className="app-chip h-9 w-9 shrink-0 bg-neutral-100 text-neutral-600">
                  <Car size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">
                    {r.drop.label.split(',')[0]}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {r.pickup.label.split(',')[0]} · {timeAgo(r.createdAt)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-bold tabular-nums">
                    {money(r.agreedFare ?? r.fixedFare ?? r.offerFare)}
                  </p>
                  <span className={`pill ${STATUS_COLOR[r.status]} !text-[10px] !py-0`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
