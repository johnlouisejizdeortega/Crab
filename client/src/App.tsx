import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './store/auth';
import { getToken } from './lib/api';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import RiderHome from './pages/RiderHome';
import DriverHome from './pages/DriverHome';
import RideHistory from './pages/RideHistory';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';

function Protected({ role, children }: { role?: 'RIDER' | 'DRIVER'; children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'DRIVER' ? '/drive' : '/ride'} replace />;
  }
  return children;
}

function FullscreenSpinner() {
  return (
    <div className="h-screen grid place-items-center text-slate-400">
      <div className="animate-pulse text-3xl">🦀</div>
    </div>
  );
}

export default function App() {
  const { init, loading, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (getToken()) init();
    else useAuth.setState({ loading: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNav = user && location.pathname !== '/';

  if (loading && getToken()) return <FullscreenSpinner />;

  return (
    <div className="min-h-screen flex flex-col">
      {showNav && <Navbar />}
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/ride"
            element={
              <Protected role="RIDER">
                <RiderHome />
              </Protected>
            }
          />
          <Route
            path="/drive"
            element={
              <Protected role="DRIVER">
                <DriverHome />
              </Protected>
            }
          />
          <Route
            path="/history"
            element={
              <Protected>
                <RideHistory />
              </Protected>
            }
          />
          <Route
            path="/wallet"
            element={
              <Protected>
                <Wallet />
              </Protected>
            }
          />
          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
