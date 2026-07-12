import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Map, Compass, BookOpen, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role;

  const guideLinks = [
    { to: '/guide/tours', label: 'My Tours', icon: Map },
    { to: '/guide/bookings', label: 'Bookings', icon: BookOpen },
  ];

  const touristLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Map },
    { to: '/browse', label: 'Browse Tours', icon: Compass },
    { to: '/discover', label: 'Discover', icon: Compass },
  ];

  const navLinks = isAuthenticated
    ? (role === 'GUIDE' ? guideLinks : touristLinks)
    : [];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-100">
      <div className="w-full px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Map size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-neutral-950">
            Tour<span className="text-emerald-600">SL</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
                isActive(link.to)
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-50">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-neutral-700">
                  {user?.firstName || user?.email}
                </span>
                {role && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                    {role}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors duration-200"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2.5 text-sm font-medium bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors duration-200"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl hover:bg-neutral-100 transition-colors duration-200"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white animate-fade-in">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-200 ${
                    isActive(link.to)
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <LogOut size={18} />
                Log out
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100">
                  <User size={18} />
                  Log in
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-neutral-900 text-white mt-1">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
