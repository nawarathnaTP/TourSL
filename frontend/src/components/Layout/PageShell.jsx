import Navbar from './Navbar';

export default function PageShell({ children, className = '' }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className={className}>{children}</main>
    </div>
  );
}
