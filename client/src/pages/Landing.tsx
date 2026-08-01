import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../store/auth';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(user.role === 'DRIVER' ? '/drive' : '/ride', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-500 to-brand-700 text-white flex flex-col">
      <header className="mx-auto w-full max-w-6xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-extrabold text-xl">
          <span className="text-2xl">🦀</span> Crab
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-ghost !bg-white/10 !text-white !border-white/20">
            Sign in
          </Link>
          <Link to="/register" className="btn bg-white text-brand-700 hover:bg-brand-50">
            Get started
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-6 grid md:grid-cols-2 gap-10 items-center py-12">
        <div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
            Ride your way.
          </h1>
          <p className="mt-5 text-lg text-white/90 max-w-md">
            Get a fixed fare in seconds, or name your own price and let nearby drivers bid for your
            trip. Two ways to ride — one app.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/register?role=RIDER"
              className="btn bg-white text-brand-700 hover:bg-brand-50 text-base px-6 py-3"
            >
              🧍 I need a ride
            </Link>
            <Link
              to="/register?role=DRIVER"
              className="btn bg-slate-900 text-white hover:bg-slate-800 text-base px-6 py-3"
            >
              🚗 I want to drive
            </Link>
          </div>

          <p className="mt-6 text-sm text-white/70">
            Demo accounts: <b>rider@crab.dev</b> / <b>driver@crab.dev</b> — password{' '}
            <b>password123</b>
          </p>
        </div>

        <div className="grid gap-4">
          <Feature emoji="⚡" title="Fixed fare" text="Upfront price from distance & time. Nearest driver auto-matched — Grab style." />
          <Feature emoji="🤝" title="Name your price" text="Propose a fare, drivers accept or counter, you pick — inDrive style bidding." />
          <Feature emoji="🗺️" title="Live tracking" text="Watch your driver approach on the map in real time, with ETA and ratings." />
        </div>
      </main>
    </div>
  );
}

function Feature({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-5">
      <div className="text-2xl">{emoji}</div>
      <h3 className="mt-2 font-bold text-lg">{title}</h3>
      <p className="text-white/80 text-sm mt-1">{text}</p>
    </div>
  );
}
