import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { Textarea } from '../../components/ui/Textarea';
import {
  BriefcaseIcon,
  CheckIcon,
  MapPinIcon,
  StarIcon,
} from '../../components/ui/icons';
import { useAuth } from '../../hooks/useAuth';
import { useCreateBooking } from '../../hooks/useBookings';
import { useHelperProfile } from '../../hooks/useHelpers';
import { useHelperReviews } from '../../hooks/useReviews';
import { planPrice } from '../../lib/format';
import {
  PLAN_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
} from '../../types';
import type { ServicePlan } from '../../schemas/helper.schema';
import type { ReviewResponse } from '../../schemas/review.schema';

const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const bookingFormSchema = z
  .object({
    servicePlanId: z.string().min(1, 'Select a service plan'),
    scheduledDate: z.string().min(1, 'Pick a date'),
    startTime: z.string().regex(timePattern, 'Start time must be HH:MM'),
    endTime: z.string().regex(timePattern, 'End time must be HH:MM'),
    notes: z.string().max(500).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.startTime >= values.endTime) {
      ctx.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'End time must be after start time',
      });
    }
    const start = new Date(`${values.scheduledDate}T${values.startTime}:00`);
    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledDate'],
        message: 'Invalid date or time',
      });
    } else if (start.getTime() <= Date.now()) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledDate'],
        message: 'Booking must be in the future',
      });
    }
  });

type BookingFormValues = z.infer<typeof bookingFormSchema>;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={`h-4 w-4 ${
            i < Math.round(rating) ? 'text-accent-500' : 'text-neutral-200'
          }`}
        />
      ))}
    </span>
  );
}

function BookingForm({
  helperId,
  plans,
}: {
  helperId: string;
  plans: ServicePlan[];
}) {
  const { mutate, isPending, isSuccess, error } = useCreateBooking();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: standardSchemaResolver(bookingFormSchema),
    defaultValues: { servicePlanId: plans[0]?.id ?? '' },
  });

  const onSubmit = handleSubmit((values) => {
    mutate({
      helperId,
      servicePlanId: values.servicePlanId,
      scheduledDate: new Date(
        `${values.scheduledDate}T${values.startTime}:00`,
      ).toISOString(),
      startTime: values.startTime,
      endTime: values.endTime,
      notes: values.notes?.trim() || undefined,
    });
  });

  if (isSuccess) {
    return (
      <Card className="p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <CheckIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-3 text-lg font-semibold text-neutral-800">
          Booking requested
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          The helper will review your request shortly. You can track it under My
          bookings.
        </p>
        <Link to="/bookings" className="inline-block">
          <Button className="mt-4">View my bookings</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold text-neutral-800">Book this helper</h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <Select
          label="Service plan"
          {...register('servicePlanId')}
          error={errors.servicePlanId?.message}
        >
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {PLAN_TYPE_LABELS[plan.planType]} — {planPrice(plan.planType, plan.price)}
            </option>
          ))}
        </Select>
        <Input
          label="Date"
          type="date"
          min={today}
          {...register('scheduledDate')}
          error={errors.scheduledDate?.message}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start"
            type="time"
            {...register('startTime')}
            error={errors.startTime?.message}
          />
          <Input
            label="End"
            type="time"
            {...register('endTime')}
            error={errors.endTime?.message}
          />
        </div>
        <Textarea
          label="Notes (optional)"
          rows={3}
          placeholder="Anything the helper should know"
          {...register('notes')}
          error={errors.notes?.message}
        />
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error.message}
          </p>
        )}
        <Button type="submit" size="lg" isLoading={isPending} className="w-full">
          Request booking
        </Button>
      </form>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </Card>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function ReviewsSection({ helperId }: { helperId: string }) {
  const query = useHelperReviews(helperId);

  if (query.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <p className="text-sm text-neutral-600">
          We couldn&apos;t load reviews right now.
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

  const reviews = query.data ?? [];
  if (reviews.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-neutral-600">
          No reviews yet. Be the first to book and share your experience.
        </p>
      </Card>
    );
  }

  return (
    <div className="divide-y divide-neutral-100 rounded-2xl bg-white shadow-sm">
      {reviews.map((review: ReviewResponse) => (
        <div key={review.id} className="p-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={review.household?.fullName ?? 'Anonymous'}
              src={review.household?.avatarUrl}
              className="h-8 w-8 text-xs"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-800">
                {review.household?.fullName ?? 'Anonymous'}
              </p>
              <p className="text-xs text-neutral-600">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Stars rating={review.rating} />
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-neutral-600">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function HelperDetailPage() {
  const { helperId } = useParams<{ helperId: string }>();
  const { user } = useAuth();
  const query = useHelperProfile(helperId ?? '');

  if (query.isLoading || !query.data) {
    return <ProfileSkeleton />;
  }

  if (query.isError) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-600">
          We couldn&apos;t load this helper&apos;s profile right now.
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

  const helper = query.data;
  const activePlans = helper.servicePlans.filter((plan) => plan.isActive);
  const availabilityEntries = Object.entries(helper.availability).filter(
    ([, times]) => times.length > 0,
  );
  const showBooking = user?.role === 'HOUSEHOLD';

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar name={helper.fullName} src={helper.avatarUrl} className="h-16 w-16 text-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-neutral-800">
                {helper.fullName}
              </h1>
              {helper.verificationStatus === 'VERIFIED' && (
                <Badge className="bg-primary-100 text-primary-700">
                  <CheckIcon className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800">
                {SERVICE_TYPE_LABELS[helper.serviceType]}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPinIcon className="h-3.5 w-3.5" />
                {helper.city}
              </span>
              <span className="inline-flex items-center gap-1">
                <BriefcaseIcon className="h-3.5 w-3.5" />
                {helper.experienceYears} yr{helper.experienceYears === 1 ? '' : 's'} experience
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Stars rating={helper.ratingAvg} />
              <span className="text-sm text-neutral-600">
                {helper.ratingCount > 0
                  ? `${helper.ratingAvg.toFixed(1)} (${helper.ratingCount} review${helper.ratingCount === 1 ? '' : 's'})`
                  : 'No reviews yet'}
              </span>
            </div>
          </div>
        </div>
        {helper.bio && (
          <p className="mt-4 text-neutral-700">{helper.bio}</p>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-neutral-800">Availability</h2>
        {availabilityEntries.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">
            Availability not set yet — reach out to confirm timings.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {availabilityEntries.map(([day, times]) => (
              <li key={day} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-sm">
                <span className="text-neutral-600">{DAY_LABELS[day] ?? day}</span>
                <span className="text-neutral-800">{times.join(', ')}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-neutral-800">Service plans</h2>
        {activePlans.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">
            This helper hasn&apos;t added any service plans yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100">
            {activePlans.map((plan) => (
              <li key={plan.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3">
                <div>
                  <p className="font-medium text-neutral-800">
                    {PLAN_TYPE_LABELS[plan.planType]}
                  </p>
                  {plan.description && (
                    <p className="text-sm text-neutral-600">{plan.description}</p>
                  )}
                </div>
                <p className="font-semibold text-neutral-800">
                  {planPrice(plan.planType, plan.price)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {showBooking &&
        (activePlans.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-neutral-600">
              Booking is unavailable until this helper adds a service plan.
            </p>
          </Card>
        ) : (
          <BookingForm helperId={helper.id} plans={activePlans} />
        ))}

      <section>
        <h2 className="text-lg font-semibold text-neutral-800">Reviews</h2>
        <div className="mt-3">
          <ReviewsSection helperId={helper.id} />
        </div>
      </section>
    </div>
  );
}