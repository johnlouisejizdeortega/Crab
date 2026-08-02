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
      {/* soft neutral glow */}
      <div className="pointer-events-none absolute -top-40 -right-32 h-[26rem] w-[26rem] rounded-full bg-neutral-400/20 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[24rem] w-[24rem] rounded-full bg-neutral-400/15 blur-[90px]" />

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
          <span className="pill material text-neutral-600 mb-4">
            <span className="text-brand-500">●</span> Two ways to ride
          </span>
          <h1 className="text-[2.5rem] leading-[1.03] sm:text-6xl font-bold tracking-[-0.03em] text-neutral-900">
            Ride your way.
          </h1>
          <p className="mt-4 text-[15px] text-neutral-500 max-w-sm leading-relaxed">
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

        <div className="grid gap-4">
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
    <div className="card p-5 flex gap-3.5 items-start transition active:scale-[.99]">
      <div className="app-chip shrink-0 h-10 w-10 bg-neutral-900 text-white">
        <Icon size={19} />
      </div>
      <div>
        <h3 className="font-semibold text-[15px]">{title}</h3>
        <p className="text-neutral-500 text-[13px] mt-0.5 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
