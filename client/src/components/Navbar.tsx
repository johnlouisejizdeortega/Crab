import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { money } from '../lib/format';
import { CrabLogo, Car, SteeringWheel, History, Wallet, UserRound, LogOut } from './icons';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`;

  const primary = user?.role === 'DRIVER'
    ? { to: '/drive', label: 'Drive', Icon: SteeringWheel }
    : { to: '/ride', label: 'Ride', Icon: Car };

  return (
    <header className="hidden md:block sticky top-0 z-[500] bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
          <span className="text-brand-500">
            <CrabLogo size={26} />
          </span>
          <span>Crab</span>
        </Link>

        {user && (
          <nav className="flex items-center gap-1">
            <NavLink to={primary.to} className={linkClass}>
              <primary.Icon size={17} /> {primary.label}
            </NavLink>
            <NavLink to="/history" className={linkClass}>
              <History size={17} /> History
            </NavLink>
            <NavLink to="/wallet" className={linkClass}>
              <Wallet size={17} /> Wallet
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              <UserRound size={17} /> Profile
            </NavLink>
            <span className="mx-2 pill bg-brand-50 text-brand-700">{money(user.wallet?.balance ?? 0)}</span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={17} /> Sign out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
