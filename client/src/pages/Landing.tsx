import { Link, useNavigate } from 'react-router-dom';
import { useEffect, ComponentType } from 'react';
import { useAuth } from '../store/auth';
import { CrabLogo, Car, SteeringWheel, Zap, Coins, Route, IconProps } from '../components/icons';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(user.role === 'DRIVER' ? '/drive' : '/ride', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-brand-500 to-brand-700 text-white flex flex-col">
      <header className="mx-auto w-full max-w-6xl px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-extrabold text-xl">
          <CrabLogo size={26} className="text-white" /> Crab
        </div>
        <Link to="/login" className="btn-ghost !bg-white/10 !text-white !border-white/20 !py-2 !px-4">
          Sign in
        </Link>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-5 grid md:grid-cols-2 gap-10 md:items-center py-8 md:py-12">
        <div>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
            Ride your way.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/90 max-w-md">
            Get a fixed fare in seconds, or name your own price and let nearby drivers bid for your
            trip. Two ways to ride — one app.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              to="/register?role=RIDER"
              className="btn bg-white text-brand-700 hover:bg-brand-50 text-base px-6 py-3.5"
            >
              <Car size={20} /> I need a ride
            </Link>
            <Link
              to="/register?role=DRIVER"
              className="btn bg-slate-900 text-white hover:bg-slate-800 text-base px-6 py-3.5"
            >
              <SteeringWheel size={20} /> I want to drive
            </Link>
          </div>

          <p className="mt-6 text-sm text-white/70">
            Demo: <b>rider@crab.dev</b> / <b>driver@crab.dev</b> — password <b>password123</b>
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4">
          <Feature Icon={Zap} title="Fixed fare" text="Upfront price from distance & time. Nearest driver auto-matched — Grab style." />
          <Feature Icon={Coins} title="Name your price" text="Propose a fare, drivers accept or counter, you pick — inDrive style bidding." />
          <Feature Icon={Route} title="Live tracking" text="Watch your driver approach on the map in real time, with ETA and ratings." />
        </div>
      </main>
    </div>
  );
}

function Feature({ Icon, title, text }: { Icon: ComponentType<IconProps>; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-5 flex gap-4">
      <div className="shrink-0 grid h-11 w-11 place-items-center rounded-xl bg-white/15">
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-white/80 text-sm mt-0.5">{text}</p>
      </div>
    </div>
  );
}
