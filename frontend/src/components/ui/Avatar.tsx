export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  const size = className ?? 'h-12 w-12 text-sm';
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${size}`}
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 ${size}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
