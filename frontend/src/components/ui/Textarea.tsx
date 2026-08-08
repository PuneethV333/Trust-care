import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-neutral-800">{label}</span>}
      <textarea
        {...props}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${
          error ? 'border-danger' : 'border-neutral-200'
        } ${className ?? ''}`}
      />
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  );
}
