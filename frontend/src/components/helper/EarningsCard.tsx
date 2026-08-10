import { useMyEarnings } from '../../hooks/useProfile';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Link } from 'react-router-dom';

export function EarningsCard() {
  const query = useMyEarnings();

  if (query.isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-neutral-800">Earnings</h2>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-full" />
        </div>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-neutral-800">Earnings</h2>
        <div className="mt-4 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-neutral-600">
            We couldn&apos;t load your earnings right now.
          </p>
          <Button type="button" variant="secondary" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  const earnings = query.data;

  if (!earnings || earnings.completedBookings === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-neutral-800">Earnings</h2>
        <p className="mt-2 text-sm text-neutral-600">
          No completed bookings yet — your earnings from completed bookings
          will appear here.
        </p>
        <Link to="/earnings" className="mt-4 inline-block">
          <Button type="button" variant="secondary">
            View earnings
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-neutral-800">Earnings</h2>
      <p className="mt-3 text-3xl font-semibold text-neutral-800">
        ₹{earnings.totalEarned}
      </p>
      <p className="mt-1 text-sm text-neutral-600">
        from {earnings.completedBookings} completed booking
        {earnings.completedBookings === 1 ? '' : 's'}
      </p>
      <ul className="mt-4 divide-y divide-neutral-100">
        {earnings.monthly.map((row) => (
          <li
            key={row.month}
            className="flex items-center justify-between gap-2 py-2.5"
          >
            <span className="text-sm font-medium text-neutral-800">
              {row.month}
            </span>
            <span className="text-sm text-neutral-600">
              {row.count} booking{row.count === 1 ? '' : 's'} ·{' '}
              <span className="font-medium text-neutral-800">
                ₹{row.totalEarned}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <Link to="/earnings" className="mt-3 inline-block">
        <Button type="button" variant="secondary">
          View earnings details
        </Button>
      </Link>
    </Card>
  );
}