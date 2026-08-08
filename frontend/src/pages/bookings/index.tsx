import { BookingCard } from '../../components/booking/BookingCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useMyBookings } from '../../hooks/useBookings';

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

export default function BookingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const query = useMyBookings(!isAdmin);

  const renderBody = () => {
    if (isAdmin) {
      return (
        <Card className="p-6 text-center">
          <p className="text-sm text-neutral-600">
            Platform-wide bookings are managed from the admin dashboard.
          </p>
        </Card>
      );
    }

    if (query.isLoading) {
      return <ListSkeleton />;
    }

    if (query.isError) {
      return (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm text-neutral-600">
            We couldn&apos;t load your bookings right now.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void query.refetch()}
          >
            Try again
          </Button>
        </Card>
      );
    }

    const bookings = query.data ?? [];
    if (bookings.length === 0) {
      return (
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-600">
            {user?.role === 'HELPER'
              ? 'You have no booking requests yet.'
              : 'You haven\'t booked anyone yet. Find a helper from the search page.'}
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-800">My bookings</h1>
      {renderBody()}
    </div>
  );
}