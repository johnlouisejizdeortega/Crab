import { useEffect, useMemo, useRef, useState } from 'react';
import { getSocket, emitAck } from '../lib/socket';
import { useAuth } from '../store/auth';
import { getCurrentPosition, haversineKm } from '../lib/geo';
import { money, km, STATUS_LABEL } from '../lib/format';
import Map, { MapMarker } from '../components/Map';
import Stars from '../components/Stars';
import RatingModal from '../components/RatingModal';
import { RadioTower, Zap, Coins, MapPin, UserRound, X } from '../components/icons';
import type { Ride } from '../types';

const CITY = { lat: 14.5995, lng: 120.9842 };

export default function DriverHome() {
  const { user, refresh } = useAuth();
  const [online, setOnline] = useState<boolean>(user?.driver?.isOnline ?? false);
  const [pos, setPos] = useState<{ lat: number; lng: number }>(
    user?.driver?.lat && user?.driver?.lng ? { lat: user.driver.lat, lng: user.driver.lng } : CITY
  );
  const [incoming, setIncoming] = useState<Ride[]>([]);
  const [active, setActive] = useState<Ride | null>(null);
  const [rateFor, setRateFor] = useState<Ride | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const meId = user!.id;
  const activeRef = useRef<Ride | null>(null);
  activeRef.current = active;

  useEffect(() => {
    const s = getSocket();
    const onNew = (r: Ride) => setIncoming((prev) => [r, ...prev.filter((x) => x.id !== r.id)]);
    const onClosed = (p: { rideId: string }) =>
      setIncoming((prev) => prev.filter((x) => x.id !== p.rideId));
    const onMatched = (r: Ride) => {
      if (r.driverId === meId) {
        setActive(r);
        setIncoming([]);
      } else {
        setIncoming((prev) => prev.filter((x) => x.id !== r.id));
      }
    };
    const onStatus = (r: Ride) => {
      if (r.driverId === meId) setActive(r);
    };
    const onCompleted = (r: Ride) => {
      if (r.driverId === meId) {
        setActive(null);
        setRateFor(r);
        refresh();
      }
    };
    const onCancelled = (r: Ride) => {
      setIncoming((prev) => prev.filter((x) => x.id !== r.id));
      if (activeRef.current && r.id === activeRef.current.id) {
        setActive(null);
        setError('Rider cancelled the trip.');
      }
    };

    s.on('ride:new', onNew);
    s.on('ride:closed', onClosed);
    s.on('ride:matched', onMatched);
    s.on('ride:status', onStatus);
    s.on('ride:completed', onCompleted);
    s.on('ride:cancelled', onCancelled);
    return () => {
      s.off('ride:new', onNew);
      s.off('ride:closed', onClosed);
      s.off('ride:matched', onMatched);
      s.off('ride:status', onStatus);
      s.off('ride:completed', onCompleted);
      s.off('ride:cancelled', onCancelled);
    };
  }, [meId, refresh]);

  async function toggleOnline() {
    setBusy(true);
    try {
      if (!online) {
        const cur = await getCurrentPosition();
        const p = cur ? { lat: cur.lat, lng: cur.lng } : pos;
        setPos(p);
        await emitAck('driver:online', { online: true, lat: p.lat, lng: p.lng });
        setOnline(true);
      } else {
        await emitAck('driver:online', { online: false });
        setOnline(false);
        setIncoming([]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // Tap the map to "drive": updates the driver position (streams to the rider).
  async function onMapClick(lat: number, lng: number) {
    if (!online) return;
    setPos({ lat, lng });
    try {
      await emitAck('driver:location', { lat, lng });
    } catch {
      /* ignore */
    }
  }

  async function accept(rideId: string) {
    setBusy(true);
    try {
      await emitAck('ride:accept', { rideId });
    } catch (e: any) {
      setError(e.message);
      setIncoming((prev) => prev.filter((x) => x.id !== rideId));
    } finally {
      setBusy(false);
    }
  }

  async function placeBid(rideId: string, amount: number, note?: string) {
    setBusy(true);
    try {
      await emitAck('bid:create', { rideId, amount, note });
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function advance(status: string) {
    if (!active) return;
    setBusy(true);
    try {
      if (status === 'COMPLETE') await emitAck('ride:complete', { rideId: active.id });
      else await emitAck('ride:status', { rideId: active.id, status });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const markers: MapMarker[] = useMemo(() => {
    const m: MapMarker[] = [{ id: 'me', lat: pos.lat, lng: pos.lng, kind: 'car' }];
    if (active) {
      m.push({ id: 'p', lat: active.pickup.lat, lng: active.pickup.lng, kind: 'pickup' });
      m.push({ id: 'd', lat: active.drop.lat, lng: active.drop.lng, kind: 'drop' });
    }
    return m;
  }, [pos, active]);

  const line = active
    ? active.status === 'IN_PROGRESS'
      ? { from: [pos.lat, pos.lng] as [number, number], to: [active.drop.lat, active.drop.lng] as [number, number] }
      : { from: [pos.lat, pos.lng] as [number, number], to: [active.pickup.lat, active.pickup.lng] as [number, number] }
    : null;

  return (
    <div className="relative flex-1 min-h-0">
      <div className="absolute inset-0">
        <Map markers={markers} line={line} onClick={onMapClick} focus={[pos.lat, pos.lng]} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[600] flex flex-col justify-end sm:block">
        <div className="pointer-events-auto space-y-3 p-3 sm:p-0 sm:absolute sm:top-6 sm:left-6 sm:w-[26rem] sm:max-w-[calc(100vw-3rem)]">
          {error && (
            <div className="card px-4 py-2 text-sm text-rose-600 flex justify-between items-center">
              {error}
              <button onClick={() => setError('')} className="text-slate-400">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Online toggle */}
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-bold">{online ? 'You’re online' : 'You’re offline'}</p>
              <p className="text-xs text-slate-500">
                {online ? 'Tap the map to move your car' : 'Go online to receive requests'}
              </p>
            </div>
            <button
              onClick={toggleOnline}
              disabled={busy || !!active}
              className={`relative h-8 w-14 rounded-full transition ${online ? 'bg-brand-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${online ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {active ? (
            <ActiveTrip trip={active} pos={pos} onAdvance={advance} busy={busy} />
          ) : online ? (
            <RequestList incoming={incoming} pos={pos} onAccept={accept} onBid={placeBid} busy={busy} />
          ) : null}
        </div>
      </div>

      {rateFor && (
        <RatingModal ride={rateFor} counterpartName={rateFor.rider?.name ?? 'your rider'} onDone={() => setRateFor(null)} />
      )}
    </div>
  );
}

function RequestList({
  incoming,
  pos,
  onAccept,
  onBid,
  busy,
}: {
  incoming: Ride[];
  pos: { lat: number; lng: number };
  onAccept: (id: string) => void;
  onBid: (id: string, amount: number, note?: string) => void;
  busy: boolean;
}) {
  if (incoming.length === 0) {
    return (
      <div className="card p-6 text-center text-slate-500">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          <RadioTower size={24} />
        </div>
        <p className="mt-3 text-sm">Waiting for ride requests nearby…</p>
      </div>
    );
  }
  return (
    <div className="space-y-3 max-h-[62vh] overflow-auto">
      {incoming.map((r) => (
        <RequestCard key={r.id} ride={r} pos={pos} onAccept={onAccept} onBid={onBid} busy={busy} />
      ))}
    </div>
  );
}

function RequestCard({
  ride,
  pos,
  onAccept,
  onBid,
  busy,
}: {
  ride: Ride;
  pos: { lat: number; lng: number };
  onAccept: (id: string) => void;
  onBid: (id: string, amount: number, note?: string) => void;
  busy: boolean;
}) {
  const [amount, setAmount] = useState<number>(ride.offerFare ?? 0);
  const toPickup = haversineKm(pos, ride.pickup);

  return (
    <div className="card p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="pill bg-brand-50 text-brand-600">
          {ride.model === 'BID' ? <Coins size={13} /> : <Zap size={13} />}
          {ride.model === 'BID' ? 'Offer' : 'Fixed'}
        </span>
        <span className="text-xs text-slate-400">{toPickup.toFixed(1)} km to pickup</span>
      </div>

      <div className="text-sm space-y-1.5">
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
          {ride.pickup.label.split(',').slice(0, 2).join(',')}
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={14} className="text-brand-500 shrink-0" />
          {ride.drop.label.split(',').slice(0, 2).join(',')}
        </p>
        <p className="text-xs text-slate-400">{km(ride.distanceKm)} trip</p>
      </div>

      {ride.model === 'FIXED' ? (
        <div className="flex items-center justify-between">
          <div className="text-2xl font-extrabold">{money(ride.fixedFare)}</div>
          <button className="btn-primary" disabled={busy} onClick={() => onAccept(ride.id)}>
            Accept
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Rider offers</span>
            <span className="font-bold">{money(ride.offerFare)}</span>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 flex-1 rounded-full border border-slate-200 px-4">
              <span className="text-slate-400">$</span>
              <input
                type="number"
                className="w-full py-2.5 outline-none bg-transparent"
                value={amount || ''}
                min={1}
                step={0.5}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <button
              className="btn-dark"
              disabled={busy || amount <= 0}
              onClick={() => onBid(ride.id, amount, amount > (ride.offerFare ?? 0) ? 'Counter offer' : undefined)}
            >
              {amount > (ride.offerFare ?? 0) ? 'Counter' : 'Bid'}
            </button>
          </div>
          <button
            className="btn-primary w-full !py-2 text-sm"
            disabled={busy}
            onClick={() => onBid(ride.id, ride.offerFare ?? 0, "I'll take your price")}
          >
            Accept their price · {money(ride.offerFare)}
          </button>
        </div>
      )}
    </div>
  );
}

function ActiveTrip({
  trip,
  pos,
  onAdvance,
  busy,
}: {
  trip: Ride;
  pos: { lat: number; lng: number };
  onAdvance: (status: string) => void;
  busy: boolean;
}) {
  const dest = trip.status === 'IN_PROGRESS' ? trip.drop : trip.pickup;
  const distTo = haversineKm(pos, dest);

  const next: { label: string; status: string } | null =
    trip.status === 'MATCHED'
      ? { label: 'Start heading to pickup', status: 'ARRIVING' }
      : trip.status === 'ARRIVING'
      ? { label: 'Start trip', status: 'IN_PROGRESS' }
      : trip.status === 'IN_PROGRESS'
      ? { label: 'Complete trip', status: 'COMPLETE' }
      : null;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Active trip</p>
          <h2 className="text-lg font-bold">{STATUS_LABEL[trip.status]}</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold">{money(trip.agreedFare)}</div>
          <div className="text-xs text-slate-400">you earn</div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <div className="h-11 w-11 rounded-full bg-brand-100 grid place-items-center text-brand-600">
          <UserRound size={22} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{trip.rider?.name ?? 'Rider'}</span>
            {trip.rider && <Stars value={trip.rider.ratingAvg} size={12} />}
          </div>
          <p className="text-xs text-slate-500">
            {trip.status === 'IN_PROGRESS' ? 'Dropping off' : 'Picking up'} · {distTo.toFixed(1)} km away
          </p>
        </div>
      </div>

      <div className="text-sm text-slate-600 space-y-1.5">
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
          {trip.pickup.label.split(',').slice(0, 2).join(',')}
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={14} className="text-brand-500 shrink-0" />
          {trip.drop.label.split(',').slice(0, 2).join(',')}
        </p>
      </div>

      <p className="text-xs text-slate-400 text-center">Tap the map to drive your car toward the pin.</p>

      {next && (
        <button className="btn-primary w-full text-base py-3" disabled={busy} onClick={() => onAdvance(next.status)}>
          {next.label}
        </button>
      )}
    </div>
  );
}
