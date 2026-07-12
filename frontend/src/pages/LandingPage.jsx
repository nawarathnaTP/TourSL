import { Link } from 'react-router-dom';
import { Map, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <nav className="px-6 h-16 flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Map size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-neutral-950">
            Tour<span className="text-emerald-600">SL</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </nav>

      {/* Hero — full remaining height */}
      <section className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.02)_0%,_transparent_60%)]" />

        <div className="relative text-center px-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-8">
            <Map size={14} />
            Explore Sri Lanka
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-neutral-950 leading-[1.1]">
            Your gateway to
            <br />
            <span className="text-emerald-600">Sri Lanka</span> tours
          </h1>

          <p className="mt-6 text-lg md:text-xl text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Discover stunning destinations, plan detailed itineraries, and book guided tours across the pearl of the Indian Ocean.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-neutral-950 text-white text-sm font-semibold rounded-2xl hover:bg-neutral-800 transition-colors duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-neutral-900 text-sm font-semibold rounded-2xl border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-colors duration-200"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
