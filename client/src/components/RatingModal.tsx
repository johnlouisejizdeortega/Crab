import { useState } from 'react';
import Stars from './Stars';
import { CheckCircle } from './icons';
import { api } from '../lib/api';
import { money } from '../lib/format';
import type { Ride } from '../types';

interface Props {
  ride: Ride;
  counterpartName: string;
  onDone: () => void;
}

export default function RatingModal({ ride, counterpartName, onDone }: Props) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.post('/users/rate', { rideId: ride.id, stars, comment: comment || undefined });
    } catch {
      /* non-fatal */
    } finally {
      onDone();
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-black/40 grid place-items-center p-4">
      <div className="card w-full max-w-sm p-6 text-center">
        <div className="app-chip mx-auto h-14 w-14 rounded-2xl bg-neutral-900 text-white">
          <CheckCircle size={30} />
        </div>
        <h2 className="mt-3 text-lg font-bold">Trip complete</h2>
        <p className="text-slate-500 text-sm">
          {money(ride.agreedFare ?? ride.fixedFare)} · {ride.distanceKm.toFixed(1)} km
        </p>

        <p className="mt-5 text-sm text-slate-600">How was {counterpartName}?</p>
        <div className="mt-2 flex justify-center">
          <Stars value={stars} onChange={setStars} size={34} />
        </div>
        <textarea
          className="textarea mt-4 h-20 resize-none text-left"
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="mt-4 flex gap-2">
          <button className="btn-ghost flex-1" onClick={onDone} disabled={busy}>
            Skip
          </button>
          <button className="btn-primary flex-1" onClick={submit} disabled={busy}>
            {busy ? 'Sending…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
