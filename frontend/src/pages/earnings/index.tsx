import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { DisputeForm } from '../../components/booking/DisputeForm';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useMyEarnings } from '../../hooks/useProfile';
import type { EarningsBooking } from '../../schemas/helper.schema';
import { PLAN_TYPE_LABELS } from '../../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function EarningsBookingRow({ booking }: { booking: EarningsBooking }) {
  const queryClient = useQueryClient();
  const [disputed, setDisputed] = useState(booking.disputed);
  const [reporting, setReporting] = useState(false);

  const submitted = () => {
    setDisputed(true);
    setReporting(false);
    void queryClient.invalidateQueries({ queryKey: ['helpers', 'me', 'earnings'] });
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div>
          <p className="font-medium text-neutral-800">
            {PLAN_TYPE_LABELS[booking.planType]} · ₹{booking.price}
          </p>
          <p className="text-sm text-neutral-600">
            {formatDate(booking.scheduledDate)}
          </p>
        </div>
        {disputed ? (
          <Badge className="bg-amber-100 text-amber-800">Dispute open</Badge>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setReporting(true)}
          >
            Report an issue
          </Button>
        )}
      </div>
      {reporting && (
        <div className="mt-3">
          <DisputeForm bookingId={booking.bookingId} onSubmitted={submitted} />
        </div>
      )}
    </Card>
  );
}

export default function EarningsPage() {
  const { user } = useAuth();
  const query = useMyEarnings(user?.role === 'HELPER');

  if (!user) return null;

  if (user.role !== 'HELPER') {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-neutral-600">
          Earnings are available to helpers only.
        </p>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-600">
          We couldn&apos;t load your earnings right now.
        </p>
        <Button type="button" variant="secondary" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  const earnings = query.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-800">My earnings</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Your earnings from completed bookings, with options to report issues.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm text-neutral-600">Total earned</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-800">
            ₹{earnings.totalEarned}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-neutral-600">Completed bookings</p>
          <p className="mt-2 text-3xl font-semibold text-neutral-800">
            {earnings.completedBookings}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-neutral-800">Monthly breakdown</h2>
        <ul className="mt-3 divide-y divide-neutral-100">
          {earnings.monthly.length === 0 && (
            <li className="py-2.5 text-sm text-neutral-600">No earnings yet.</li>
          )}
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
      </Card>

      <section>
        <h2 className="text-lg font-semibold text-neutral-800">Earning entries</h2>
        {earnings.bookings.length === 0 ? (
          <Card className="mt-3 p-8 text-center">
            <p className="text-sm text-neutral-600">
              No completed bookings yet — your earnings will appear here.
            </p>
          </Card>
        ) : (
          <div className="mt-3 space-y-3">
            {earnings.bookings.map((booking) => (
              <EarningsBookingRow key={booking.bookingId} booking={booking} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}