import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/shared/Toast';
import GoogleSignInButton from '../components/GoogleSignInButton';
import Input from '../components/shared/Input';
import Button from '../components/shared/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const goHome = (data) => {
    const role = data?.role;
    navigate(role === 'GUIDE' ? '/guide/tours' : '/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      goHome(data);
    } catch (err) {
      toast(err.response?.data?.message || 'Invalid credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (idToken) => {
    try {
      const data = await googleLogin(idToken, 'TOURIST');
      goHome(data);
    } catch (err) {
      toast(err.response?.data?.message || 'Google sign-in failed', 'error');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - form */}
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

          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Welcome back</h1>
          <p className="mt-2 text-sm text-neutral-500">Sign in to continue to TourSL</p>

          <div className="mt-8">
            <GoogleSignInButton onSuccess={handleGoogle} />
          </div>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400 font-medium">or</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="mt-2 w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-sm text-neutral-500 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors duration-200">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right - decorative */}
      <div className="hidden lg:flex flex-1 bg-neutral-950 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.15)_0%,_transparent_70%)]" />
        <div className="relative text-center px-12">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Map size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Explore Sri Lanka</h2>
          <p className="mt-4 text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Discover stunning temples, pristine beaches, lush tea plantations, and vibrant culture.
          </p>
        </div>
      </div>
    </div>
  );
}
