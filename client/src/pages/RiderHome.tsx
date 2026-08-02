import { useEffect, useMemo, useRef, useState } from 'react';
import { getSocket, emitAck } from '../lib/socket';
import { api } from '../lib/api';
import { useAuth } from '../store/auth';
import { getCurrentPosition, haversineKm, reverseGeocode } from '../lib/geo';
import { money, km, mins, STATUS_LABEL } from '../lib/format';
import Map, { MapMarker } from '../components/Map';
import AddressSearch from '../components/AddressSearch';
import Stars from '../components/Stars';
import RatingModal from '../components/RatingModal';
import {
  MapPin,
  Route,
  Clock,
  Zap,
  Coins,
  Search,
  Car,
  UserRound,
  ArrowRight,
  X,
} from '../components/icons';
import type { Bid, Estimate, Point, Ride, RideModel } from '../types';

const CITY: Point = { lat: 14.5995, lng: 120.9842, label: 'Manila' };

export default function RiderHome() {
  const { refresh } = useAuth();
  const [pickup, setPickup] = useState<Point | null>(null);
  const [drop, setDrop] = useState<Point | null>(null);
  const [picking, setPicking] = useState<'pickup' | 'drop'>('drop');
  const [mode, setMode] = useState<RideModel>('FIXED');
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [offer, setOffer] = useState<number>(0);
  const [estimating, setEstimating] = useState(false);

  const [ride, setRide] = useState<Ride | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');
  const [rateFor, setRateFor] = useState<Ride | null>(null);
  const [busy, setBusy] = useState(false);
  const rideRef = useRef<Ride | null>(null);
  rideRef.current = ride;

  // Initial pickup = current location (or city fallback).
  useEffect(() => {
    getCurrentPosition().then((p) => setPickup(p ?? CITY));
  }, []);

  // Socket listeners for the whole rider lifecycle.
  useEffect(() => {
    const s = getSocket();
    const onMatched = (r: Ride) => {
      setRide(r);
      setBids([]);
    };
    const onBid = (b: Bid) => setBids((prev) => [...prev.filter((x) => x.id !== b.id), b]);
    const onMoved = (p: { rideId: string; lat: number; lng: number }) => {
      if (rideRef.current && p.rideId === rideRef.current.id) setDriverPos({ lat: p.lat, lng: p.lng });
    };
    const onStatus = (r: Ride) => setRide(r);
    const onCompleted = (r: Ride) => {
      setRide(null);
      setDriverPos(null);
      setRateFor(r);
      refresh();
    };
    const onCancelled = (r: Ride) => {
      setRide(null);
      setDriverPos(null);
      setBids([]);
      if (r.status === 'CANCELLED') setError('Ride cancelled.');
    };

    s.on('ride:matched', onMatched);
    s.on('bid:new', onBid);
    s.on('driver:moved', onMoved);
    s.on('ride:status', onStatus);
    s.on('ride:completed', onCompleted);
    s.on('ride:cancelled', onCancelled);
    return () => {
      s.off('ride:matched', onMatched);
      s.off('bid:new', onBid);
      s.off('driver:moved', onMoved);
      s.off('ride:status', onStatus);
      s.off('ride:completed', onCompleted);
      s.off('ride:cancelled', onCancelled);
    };
  }, [refresh]);

  // (Re)estimate whenever both endpoints are set.
  useEffect(() => {
    if (!pickup || !drop) {
      setEstimate(null);
      return;
    }
    setEstimating(true);
    const t = setTimeout(async () => {
      try {
        const est = await api.post<Estimate>('/rides/estimate', {
          pickup: { lat: pickup.lat, lng: pickup.lng },
          drop: { lat: drop.lat, lng: drop.lng },
        });
        setEstimate(est);
        setOffer((o) => (o ? o : est.suggestedBid.recommended));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setEstimating(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [pickup?.lat, pickup?.lng, drop?.lat, drop?.lng]);

  async function onMapClick(lat: number, lng: number) {
    if (ride) return;
    const label = await reverseGeocode(lat, lng);
    if (picking === 'pickup') setPickup({ lat, lng, label });
    else {
      setDrop({ lat, lng, label });
      setPicking('drop');
    }
  }

  async function requestRide() {
    if (!pickup || !drop) return;
    setBusy(true);
    setError('');
    try {
      await emitAck('ride:request', {
        pickup,
        drop,
        model: mode,
        offerFare: mode === 'BID' ? offer : undefined,
      });
      // Optimistically enter "searching" state; server confirms via ride:requested.
      setRide({
        id: 'pending',
        riderId: '',
        driverId: null,
        pickup,
        drop,
        model: mode,
        fixedFare: estimate?.fixedFare ?? null,
        offerFare: mode === 'BID' ? offer : null,
        agreedFare: null,
        distanceKm: estimate?.distanceKm ?? 0,
        durationMin: estimate?.durationMin ?? 0,
        status: 'REQUESTED',
        createdAt: new Date().toISOString(),
        matchedAt: null,
        completedAt: null,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function acceptBid(bidId: string) {
    setBusy(true);
    try {
      await emitAck('bid:accept', { bidId });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelRide() {
    if (!ride || ride.id === 'pending') {
      setRide(null);
      return;
    }
    try {
      await emitAck('ride:cancel', { rideId: ride.id });
    } catch (e: any) {
      setError(e.message);
    }
    setRide(null);
    setBids([]);
  }

  const markers: MapMarker[] = useMemo(() => {
    const m: MapMarker[] = [];
    if (pickup) m.push({ id: 'pickup', lat: pickup.lat, lng: pickup.lng, kind: 'pickup' });
    if (drop) m.push({ id: 'drop', lat: drop.lat, lng: drop.lng, kind: 'drop' });
    if (driverPos) m.push({ id: 'car', lat: driverPos.lat, lng: driverPos.lng, kind: 'car' });
    return m;
  }, [pickup, drop, driverPos]);

  const line = pickup && drop ? { from: [pickup.lat, pickup.lng] as [number, number], to: [drop.lat, drop.lng] as [number, number] } : null;

  const etaMin =
    driverPos && ride && (ride.status === 'MATCHED' || ride.status === 'ARRIVING')
      ? Math.max(1, Math.round((haversineKm(driverPos, ride.pickup) / 28) * 60))
      : null;

  return (
    <div className="relative flex-1 min-h-0">
      <div className="absolute inset-0">
        <Map markers={markers} line={line} onClick={onMapClick} focus={driverPos ? [driverPos.lat, driverPos.lng] : undefined} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[600] flex flex-col justify-end sm:block">
        <div className="pointer-events-auto space-y-3 sm:absolute sm:top-6 sm:left-6 sm:w-[26rem] sm:max-w-[calc(100vw-3rem)]">
          {error && (
            <div className="mx-3 sm:mx-0 card px-4 py-2 text-sm text-rose-600 flex justify-between items-center">
              {error}
              <button onClick={() => setError('')} className="text-slate-400">
                <X size={16} />
              </button>
            </div>
          )}

          {!ride && (
            <RequestForm
              pickup={pickup}
              drop={drop}
              picking={picking}
              setPicking={setPicking}
              setPickup={setPickup}
              setDrop={setDrop}
              mode={mode}
              setMode={setMode}
              estimate={estimate}
              estimating={estimating}
              offer={offer}
              setOffer={setOffer}
              onRequest={requestRide}
              busy={busy}
            />
          )}

          {ride && (
            <ActiveRidePanel
              ride={ride}
              bids={bids}
              etaMin={etaMin}
              onAcceptBid={acceptBid}
              onCancel={cancelRide}
              busy={busy}
            />
          )}
        </div>
      </div>

      {rateFor && (
        <RatingModal
          ride={rateFor}
          counterpartName={rateFor.driver?.name ?? 'your driver'}
          onDone={() => setRateFor(null)}
        />
      )}
    </div>
  );
}

/* ---------- Request form ---------- */

function RequestForm(props: {
  pickup: Point | null;
  drop: Point | null;
  picking: 'pickup' | 'drop';
  setPicking: (v: 'pickup' | 'drop') => void;
  setPickup: (p: Point) => void;
  setDrop: (p: Point) => void;
  mode: RideModel;
  setMode: (m: RideModel) => void;
  estimate: Estimate | null;
  estimating: boolean;
  offer: number;
  setOffer: (n: number) => void;
  onRequest: () => void;
  busy: boolean;
}) {
  const { pickup, drop, mode, setMode, estimate, estimating, offer, setOffer } = props;
  const ready = pickup && drop && estimate;

  return (
    <div className="card-glass p-6 space-y-5 rounded-b-none rounded-t-[2rem] sm:rounded-[2rem] max-h-[82vh] overflow-y-auto">
      <div className="grabber" />
      <div>
        <h1 className="text-xl font-bold">Where to?</h1>
        <p className="text-sm text-slate-500 mt-0.5">Search an address or tap the map.</p>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <AddressSearch
              placeholder="Pickup location"
              value={pickup?.label ?? ''}
              onSelect={(s) => props.setPickup({ lat: s.lat, lng: s.lng, label: s.label })}
            />
          </div>
          <button
            className={`btn-ghost px-3 ${props.picking === 'pickup' ? '!border-brand-400 !text-brand-600' : ''}`}
            title="Set pickup by tapping the map"
            onClick={() => props.setPicking('pickup')}
          >
            <MapPin size={18} />
          </button>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <AddressSearch
              placeholder="Destination"
              value={drop?.label ?? ''}
              onSelect={(s) => props.setDrop({ lat: s.lat, lng: s.lng, label: s.label })}
            />
          </div>
          <button
            className={`btn-ghost px-3 ${props.picking === 'drop' ? '!border-brand-400 !text-brand-600' : ''}`}
            title="Set destination by tapping the map"
            onClick={() => props.setPicking('drop')}
          >
            <MapPin size={18} />
          </button>
        </div>
      </div>

      {estimating && <p className="text-sm text-slate-400">Calculating route…</p>}
      {estimate && (
        <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-2">
          <span className="flex items-center gap-1.5"><Route size={16} className="text-slate-400" /> {km(estimate.distanceKm)}</span>
          <span className="flex items-center gap-1.5"><Clock size={16} className="text-slate-400" /> {mins(estimate.durationMin)}</span>
        </div>
      )}

      <div className="segment grid-cols-2">
        <button
          onClick={() => setMode('FIXED')}
          className={`segment-btn ${mode === 'FIXED' ? 'segment-btn-active' : ''}`}
        >
          <Zap size={16} /> Fixed fare
        </button>
        <button
          onClick={() => setMode('BID')}
          className={`segment-btn ${mode === 'BID' ? 'segment-btn-active' : ''}`}
        >
          <Coins size={16} /> Name price
        </button>
      </div>

      {mode === 'FIXED' ? (
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">Upfront fare</p>
            <p className="font-display text-4xl font-bold">{estimate ? money(estimate.fixedFare) : '—'}</p>
          </div>
          <span className="pill bg-brand-50 text-brand-700">Auto-matched</span>
        </div>
      ) : (
        <div>
          <label className="label">Your offer</label>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-400">$</span>
            <input
              type="number"
              min={1}
              step={0.5}
              className="input text-2xl font-extrabold"
              value={offer || ''}
              onChange={(e) => setOffer(parseFloat(e.target.value) || 0)}
            />
          </div>
          {estimate && (
            <div className="mt-2 flex gap-2 text-xs">
              {[estimate.suggestedBid.low, estimate.suggestedBid.recommended, estimate.suggestedBid.high].map(
                (v, i) => (
                  <button
                    key={i}
                    onClick={() => setOffer(v)}
                    className="pill bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    {['Low', 'Fair', 'Fast'][i]} {money(v)}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}

      <button
        className="btn-primary w-full text-base py-3"
        disabled={!ready || props.busy || (mode === 'BID' && offer <= 0)}
        onClick={props.onRequest}
      >
        {props.busy ? 'Requesting…' : mode === 'FIXED' ? `Request · ${estimate ? money(estimate.fixedFare) : ''}` : `Send offer · ${money(offer)}`}
      </button>
    </div>
  );
}

/* ---------- Active ride panel ---------- */

function ActiveRidePanel({
  ride,
  bids,
  etaMin,
  onAcceptBid,
  onCancel,
  busy,
}: {
  ride: Ride;
  bids: Bid[];
  etaMin: number | null;
  onAcceptBid: (id: string) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const searching = ride.status === 'REQUESTED';
  const sortedBids = [...bids].sort((a, b) => a.amount - b.amount);

  return (
    <div className="card-glass p-6 space-y-5 rounded-b-none rounded-t-[2rem] sm:rounded-[2rem] max-h-[82vh] overflow-y-auto">
      <div className="grabber" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {ride.model === 'BID' ? 'Name your price' : 'Fixed fare'}
          </p>
          <h2 className="text-lg font-bold">{STATUS_LABEL[ride.status]}</h2>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow-sm">
          {searching ? <Search size={20} /> : <Car size={20} />}
        </span>
      </div>

      {searching && ride.model === 'FIXED' && (
        <div className="flex items-center gap-3 text-slate-500">
          <span className="inline-block h-3 w-3 rounded-full bg-brand-400 animate-ping" />
          Matching you with the nearest driver…
        </div>
      )}

      {searching && ride.model === 'BID' && (
        <div className="space-y-2">
          <p className="text-sm text-slate-500">
            {sortedBids.length === 0 ? 'Waiting for driver offers…' : 'Choose a driver:'}
          </p>
          {sortedBids.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{b.driver?.name ?? 'Driver'}</span>
                  {b.driver && <Stars value={b.driver.ratingAvg} size={12} />}
                </div>
                <p className="text-xs text-slate-500">
                  {b.driver?.vehicle ? `${b.driver.vehicle.color} ${b.driver.vehicle.model}` : ''}
                  {b.note ? ` · “${b.note}”` : ''}
                </p>
              </div>
              <div className="text-right">
                <div className="font-extrabold">{money(b.amount)}</div>
                <button className="btn-primary !py-1 !px-3 text-xs mt-1" disabled={busy} onClick={() => onAcceptBid(b.id)}>
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!searching && ride.driver && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50/80 p-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center text-white shadow-glow-sm">
              <UserRound size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{ride.driver.name}</span>
                <Stars value={ride.driver.ratingAvg} size={12} />
              </div>
              <p className="text-xs text-slate-500">
                {ride.driver.vehicle
                  ? `${ride.driver.vehicle.color} ${ride.driver.vehicle.model} · ${ride.driver.vehicle.plate}`
                  : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="font-extrabold">{money(ride.agreedFare)}</div>
              {etaMin != null && <div className="text-xs text-slate-500">~{etaMin} min away</div>}
            </div>
          </div>
          <TripProgress status={ride.status} />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> {ride.pickup.label.split(',')[0]}
        </span>
        <ArrowRight size={14} className="text-slate-300" />
        <span className="flex items-center gap-1.5">
          <MapPin size={13} className="text-brand-500" /> {ride.drop.label.split(',')[0]}
        </span>
      </div>

      {ride.status !== 'IN_PROGRESS' && (
        <button className="btn-ghost w-full !text-rose-600" onClick={onCancel}>
          Cancel ride
        </button>
      )}
    </div>
  );
}

function TripProgress({ status }: { status: string }) {
  const steps = ['MATCHED', 'ARRIVING', 'IN_PROGRESS', 'COMPLETED'];
  const idx = steps.indexOf(status);
  const labels = ['Matched', 'On the way', 'On trip', 'Done'];
  return (
    <div className="flex items-center gap-1">
      {labels.map((l, i) => (
        <div key={l} className="flex-1">
          <div className={`h-1.5 rounded-full ${i <= idx ? 'bg-brand-500' : 'bg-slate-200'}`} />
          <p className={`mt-1 text-[10px] text-center ${i <= idx ? 'text-brand-600 font-medium' : 'text-slate-400'}`}>{l}</p>
        </div>
      ))}
    </div>
  );
}
