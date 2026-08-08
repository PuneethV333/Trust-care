import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBookingAction } from '../../hooks/useBookings';
import {
  BOOKING_STATUS_LABELS,
  PLAN_TYPE_LABELS,
  type BookingStatus,
} from '../../types';
import type { BookingResponse } from '../../schemas/booking.schema';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ReviewForm } from '../review/ReviewForm';

const statusClasses: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-primary-100 text-primary-700',
  REJECTED: 'bg-danger/10 text-danger',
  ONGOING: 'bg-primary-100 text-primary-700',
  COMPLETED: 'bg-neutral-100 text-neutral-800',
  CANCELLED: 'bg-neutral-100 text-neutral-600',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function BookingCard({ booking }: { booking: BookingResponse }) {
  const { user } = useAuth();
  const { mutate, isPending, error } = useBookingAction();
  const [reviewed, setReviewed] = useState(false);

  const isHousehold = user?.role === 'HOUSEHOLD';
  const isHelper = user?.role === 'HELPER';

  const canReview = isHousehold && booking.status === 'COMPLETED';

  const otherParty =
    isHousehold && booking.helper
      ? { name: booking.helper.fullName, avatarUrl: booking.helper.avatarUrl }
      : isHelper && booking.household
        ? { name: booking.household.fullName, avatarUrl: null }
        : null;
  const partnerName = otherParty;

  const canCancel =
    isHousehold && (booking.status === 'ACCEPTED' || booking.status === 'ONGOING');
  const canRespond = isHelper && booking.status === 'PENDING';
  const canComplete =
    isHelper && (booking.status === 'ACCEPTED' || booking.status === 'ONGOING');

  const act = (action: 'accept' | 'reject' | 'cancel' | 'complete') =>
    mutate({ id: booking.id, action });

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            name={partnerName?.name ?? 'Unknown'}
            src={partnerName?.avatarUrl}
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-800">
              {partnerName?.name ?? 'Unknown'}
            </p>
            {booking.servicePlan && (
              <p className="text-sm text-neutral-600">
                {PLAN_TYPE_LABELS[booking.servicePlan.planType]} · ₹
                {booking.servicePlan.price}/hr
              </p>
            )}
          </div>
        </div>
        <Badge className={`shrink-0 ${statusClasses[booking.status]}`}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>

      <div className="mt-3 text-sm text-neutral-600">
        {formatDate(booking.scheduledDate)} · {booking.startTime}–
        {booking.endTime}
        {booking.notes && <p className="mt-1">{booking.notes}</p>}
      </div>

      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error.message}
        </p>
      )}

      {(canCancel || canRespond || canComplete) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {canRespond && (
            <>
              <Button
                type="button"
                onClick={() => act('accept')}
                isLoading={isPending}
              >
                Accept
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => act('reject')}
                isLoading={isPending}
              >
                Reject
              </Button>
            </>
          )}
          {canComplete && (
            <Button
              type="button"
              onClick={() => act('complete')}
              isLoading={isPending}
            >
              Mark completed
            </Button>
          )}
          {canCancel && (
            <Button
              type="button"
              variant="danger"
              onClick={() => act('cancel')}
              isLoading={isPending}
            >
              Cancel booking
            </Button>
          )}
        </div>
      )}

      {canReview &&
        (reviewed ? (
          <p className="mt-4 rounded-xl bg-primary-100 px-3 py-2 text-sm text-primary-700">
            Thanks! Your review has been submitted.
          </p>
        ) : (
          <div className="mt-4">
            <ReviewForm
              bookingId={booking.id}
              onSubmitted={() => setReviewed(true)}
            />
          </div>
        ))}
    </Card>
  );
}