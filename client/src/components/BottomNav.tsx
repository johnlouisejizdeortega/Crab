import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Car, SteeringWheel, History, Wallet, UserRound, IconProps } from './icons';

type Tab = { to: string; label: string; Icon: (p: IconProps) => JSX.Element; match?: string[] };

export default function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
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
          { to: '/ride', label: 'Ride', Icon: Car, match: ['/ride', '/book'] },
          { to: '/history', label: 'History', Icon: History },
          { to: '/wallet', label: 'Wallet', Icon: Wallet },
          { to: '/profile', label: 'Profile', Icon: UserRound },
        ];

  return (
    <nav className="md:hidden sticky bottom-0 z-[900] material-bar border-t border-black/[0.07] pb-safe">
      <div className="grid grid-cols-4 px-2 pt-1.5">
        {tabs.map(({ to, label, Icon, match }) => {
          const isActive = (match ?? [to]).some((m) => pathname === m || pathname.startsWith(m + '/'));
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 py-1.5 text-[10px] font-medium transition ${
                isActive ? 'text-brand-600' : 'text-neutral-500'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.9} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
