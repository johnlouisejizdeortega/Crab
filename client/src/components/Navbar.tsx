import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { money } from '../lib/format';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-[500] bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
          <span className="text-2xl">🦀</span>
          <span>
            Crab<span className="text-brand-500">.</span>
          </span>
        </Link>

        {user && (
          <nav className="flex items-center gap-1">
            <NavLink to={user.role === 'DRIVER' ? '/drive' : '/ride'} className={linkClass}>
              {user.role === 'DRIVER' ? 'Drive' : 'Ride'}
            </NavLink>
            <NavLink to="/history" className={linkClass}>
              History
            </NavLink>
            <NavLink to="/wallet" className={linkClass}>
              Wallet
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>
            <span className="hidden sm:inline mx-2 pill bg-brand-50 text-brand-700">
              {money(user.wallet?.balance ?? 0)}
            </span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
            >
              Sign out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
