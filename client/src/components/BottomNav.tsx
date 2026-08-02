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
    <nav className="md:hidden sticky bottom-0 z-[900] bg-white/90 backdrop-blur-xl border-t border-slate-100 pb-safe">
      <div className="grid grid-cols-4 px-2 pt-1.5">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid h-9 w-14 place-items-center rounded-full transition ${
                    isActive ? 'bg-brand-50' : ''
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
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
