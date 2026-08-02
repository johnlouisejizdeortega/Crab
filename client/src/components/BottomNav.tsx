import { NavLink } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Car, SteeringWheel, History, Wallet, UserRound, IconProps } from './icons';

type Tab = { to: string; label: string; Icon: (p: IconProps) => JSX.Element };

export default function BottomNav() {
  const { user } = useAuth();
  if (!user) return null;

  const tabs: Tab[] =
    user.role === 'DRIVER'
      ? [
          { to: '/drive', label: 'Drive', Icon: SteeringWheel },
          { to: '/history', label: 'History', Icon: History },
          { to: '/wallet', label: 'Wallet', Icon: Wallet },
          { to: '/profile', label: 'Profile', Icon: UserRound },
        ]
      : [
          { to: '/ride', label: 'Ride', Icon: Car },
          { to: '/history', label: 'History', Icon: History },
          { to: '/wallet', label: 'Wallet', Icon: Wallet },
          { to: '/profile', label: 'Profile', Icon: UserRound },
        ];

  return (
    <nav className="md:hidden sticky bottom-0 z-[900] glass border-t border-white/70 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.15)] pb-safe">
      <div className="grid grid-cols-4 px-2 pt-2">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 text-[11px] font-semibold transition ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid h-9 w-14 place-items-center rounded-full transition ${
                    isActive
                      ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow-sm'
                      : ''
                  }`}
                >
                  <Icon size={21} strokeWidth={isActive ? 2.3 : 2} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
