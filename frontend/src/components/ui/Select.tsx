import type { ReactNode, SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-neutral-800">{label}</span>}
      <select
        {...props}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${
          error ? 'border-danger' : 'border-neutral-200'
        } ${className ?? ''}`}
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  );
}
