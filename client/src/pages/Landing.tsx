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
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden text-slate-900">
      {/* mesh glow */}
      <div className="pointer-events-none absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-300/40 blur-[90px]" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[26rem] w-[26rem] rounded-full bg-sky-300/30 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[24rem] w-[24rem] rounded-full bg-brand-200/40 blur-[90px]" />

      <header className="relative mx-auto w-full max-w-6xl px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-extrabold text-xl">
          <CrabLogo size={26} className="text-brand-500" /> Crab
        </div>
        <Link to="/login" className="btn-ghost !py-2 !px-4 text-sm">
          Sign in
        </Link>
      </header>

      <main className="relative flex-1 mx-auto w-full max-w-6xl px-5 grid md:grid-cols-2 gap-12 md:items-center py-10 md:py-16">
        <div className="animate-fade-up">
          <span className="pill material text-brand-600 mb-5">● Two ways to ride</span>
          <h1 className="text-[3rem] leading-[1.02] sm:text-[4.25rem] font-bold tracking-[-0.03em]">
            Ride <span className="text-brand-500">your way.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-500 max-w-md leading-relaxed">
            Get a fixed fare in seconds, or name your own price and let nearby drivers bid for your
            trip. One app, your terms.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/register?role=RIDER" className="btn-primary btn-lg">
              <Car size={20} /> I need a ride
            </Link>
            <Link to="/register?role=DRIVER" className="btn-tinted btn-lg">
              <SteeringWheel size={20} /> I want to drive
            </Link>
          </div>

          <p className="mt-7 text-sm text-slate-400">
            Demo · <span className="text-slate-500 font-medium">rider@crab.dev</span> /{' '}
            <span className="text-slate-500 font-medium">driver@crab.dev</span> · password123
          </p>
        </div>

        <div className="grid gap-3.5">
          <Feature Icon={Zap} title="Fixed fare" text="Upfront price from distance & time. Nearest driver auto-matched." />
          <Feature Icon={Coins} title="Name your price" text="Propose a fare, drivers accept or counter, you choose." />
          <Feature Icon={Route} title="Live tracking" text="Watch your driver approach in real time, with ETA & ratings." />
        </div>
      </main>
    </div>
  );
}

function Feature({ Icon, title, text }: { Icon: ComponentType<IconProps>; title: string; text: string }) {
  return (
    <div className="card p-5 flex gap-4 items-start transition active:scale-[.99]">
      <div className="app-chip shrink-0 h-11 w-11 bg-brand-500">
        <Icon size={21} />
      </div>
      <div>
        <h3 className="font-bold text-[17px]">{title}</h3>
        <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
