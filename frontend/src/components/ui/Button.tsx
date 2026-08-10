import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "light";
type Size = "md" | "lg";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-500 text-white hover:bg-primary-600",

  secondary:
    "bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-100",

  ghost:
    "bg-transparent text-primary-700 hover:bg-primary-50",

  danger:
    "bg-transparent text-danger border border-danger hover:bg-red-50",

  light:
    "bg-white text-emerald-700 hover:bg-emerald-50",
};

const sizeClasses: Record<Size, string> = {
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${className ?? ""}`}
    >
      {isLoading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}