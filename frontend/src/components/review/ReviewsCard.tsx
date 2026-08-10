import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMyReviews } from '../../hooks/useReviews';
import type { PendingReview, ReviewResponse } from '../../schemas/review.schema';
import { planPrice } from '../../lib/format';
import { PLAN_TYPE_LABELS } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { StarIcon } from '../ui/icons';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-accent-500' : 'text-neutral-200'}`}
        />
      ))}
    </span>
  );
}

export function ReviewsCard() {
  const { user } = useAuth();
  const isHousehold = user?.role === 'HOUSEHOLD';
  const isHelper = user?.role === 'HELPER';
  const query = useMyReviews(isHousehold || isHelper);

  const renderPending = (pending: PendingReview[]) => {
    if (pending.length === 0) return null;
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-neutral-600">
          {isHousehold
            ? 'Bookings awaiting your review'
            : 'Bookings awaiting review'}
        </h3>
        <ul className="divide-y divide-neutral-100">
          {pending.map((item) => (
            <li
              key={item.bookingId}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-800">
                  {item.otherParty.fullName}
                </p>
                <p className="text-sm text-neutral-600">
                  {PLAN_TYPE_LABELS[item.planType]} · {planPrice(item.planType, item.price)} ·{' '}
                  {formatDate(item.scheduledDate)}
                </p>
              </div>
              {isHousehold ? (
                <Link to="/bookings" className="shrink-0">
                  <Button type="button" variant="secondary">
                    Review
                  </Button>
                </Link>
              ) : (
                <Badge className="shrink-0 bg-neutral-100 text-neutral-600">
                  Awaiting review
                </Badge>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderReviewed = (reviewed: ReviewResponse[]) => {
    if (reviewed.length === 0) return null;
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-neutral-600">
          {isHousehold ? 'Reviews you sent' : 'Reviews from households'}
        </h3>
        <ul className="divide-y divide-neutral-100">
          {reviewed.map((review) => {
            const name = isHousehold
              ? (review.helper?.fullName ?? 'Helper')
              : (review.household?.fullName ?? 'Household');
            return (
              <li key={review.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-neutral-800">{name}</p>
                  {isHousehold && (
                    <Badge className="shrink-0 bg-primary-100 text-primary-700">
                      Sent
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Stars rating={review.rating} />
                  <span className="text-xs text-neutral-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-1 text-sm text-neutral-600">{review.comment}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const empty =
    query.data &&
    query.data.pending.length === 0 &&
    query.data.reviewed.length === 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-800">Reviews</h2>
        {isHousehold && query.data && query.data.pending.length > 0 && (
          <Badge className="bg-accent-100 text-accent-800">
            {query.data.pending.length} pending
          </Badge>
        )}
      </div>

      {query.isLoading && (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {query.isError && (
        <div className="mt-4 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-neutral-600">
            We couldn&apos;t load your reviews right now.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void query.refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {query.data && (
        <>
          {renderPending(query.data.pending)}
          {renderReviewed(query.data.reviewed)}
          {empty && (
            <p className="mt-4 text-sm text-neutral-600">
              {isHousehold
                ? 'No reviews yet — leave one after a completed booking.'
                : 'No reviews yet — they will appear after households review your completed bookings.'}
            </p>
          )}
        </>
      )}
    </Card>
  );
}