import Spinner from './Spinner';

const variants = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 active:bg-emerald-800 shadow-[0_2px_8px_rgba(16,185,129,0.25)]',
  secondary: 'bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-500 active:bg-neutral-950',
  outline: 'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 focus-visible:ring-neutral-400 active:bg-neutral-100',
  ghost: 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-400 active:bg-neutral-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 active:bg-red-800',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner size={size === 'sm' ? 14 : 18} />}
      {children}
    </button>
  );
}
