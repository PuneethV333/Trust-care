import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={twMerge("rounded-2xl bg-white shadow-sm", className)}
    />
  );
}