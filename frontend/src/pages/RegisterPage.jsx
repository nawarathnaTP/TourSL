import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Map, Compass, Users } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/shared/Toast';
import GoogleSignInButton from '../components/GoogleSignInButton';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role')?.toUpperCase() === 'GUIDE' ? 'GUIDE' : 'TOURIST';

  const [role, setRole] = useState(initialRole);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, googleLogin } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const goHome = (data) => {
    const r = data?.role || role;
    navigate(r === 'GUIDE' ? '/guide/tours' : '/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await register(role, { firstName, lastName, email, password });
      goHome(data);
    } catch (err) {
      toast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (idToken) => {
    try {
      const data = await googleLogin(idToken, role);
      goHome(data);
    } catch (err) {
      toast(err.response?.data?.message || 'Google sign-in failed', 'error');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - decorative */}
      <div className="hidden lg:flex flex-1 bg-neutral-950 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.15)_0%,_transparent_70%)]" />
        <div className="relative text-center px-12">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Map size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Start your journey</h2>
          <p className="mt-4 text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Whether you're exploring as a tourist or leading as a guide, TourSL has you covered.
          </p>
        </div>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Map size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-950">
              Tour<span className="text-emerald-600">SL</span>
            </span>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Create account</h1>
          <p className="mt-2 text-sm text-neutral-500">Choose your role and get started</p>

          {/* Role selector */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { value: 'TOURIST', label: 'Tourist', icon: Compass, desc: 'Browse & book tours' },
              { value: 'GUIDE', label: 'Guide', icon: Users, desc: 'Create & manage tours' },
            ].map((r) => {
              const Icon = r.icon;
              const selected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                    selected
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <Icon size={20} className={selected ? 'text-emerald-600' : 'text-neutral-400'} />
                  <div className={`mt-2 text-sm font-semibold ${selected ? 'text-emerald-700' : 'text-neutral-900'}`}>
                    {r.label}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">{r.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <GoogleSignInButton onSuccess={handleGoogle} text="signup_with" />
          </div>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400 font-medium">or</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First name"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last name"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <Button type="submit" loading={loading} className="mt-2 w-full">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-sm text-neutral-500 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors duration-200">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
