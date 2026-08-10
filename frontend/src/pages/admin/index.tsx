import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { BookingCard } from '../../components/booking/BookingCard';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  useAdminAnalytics,
  useAdminBookings,
  useAdminDisputes,
  useAdminHelpersDecision,
  useAdminUsers,
  usePendingHelpers,
  useResolveDispute,
} from '../../hooks/useAdmin';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_VALUES,
  DISPUTE_STATUS_LABELS,
  DISPUTE_STATUS_VALUES,
  ROLE_LABELS,
  SERVICE_TYPE_LABELS,
  type BookingStatus,
  type DisputeStatus,
} from '../../types';
import type {
  AdminHelperItem,
  AdminUserItem,
} from '../../schemas/admin.schema';
import type { AdminDisputeItem } from '../../schemas/dispute.schema';
import { Textarea } from '../../components/ui/Textarea';

const NAV_SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'pending', label: 'Pending verifications' },
  { key: 'users', label: 'Users' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'disputes', label: 'Disputes' },
] as const;

type SectionKey = (typeof NAV_SECTIONS)[number]['key'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Button
        type="button"
        variant="secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <p className="text-sm text-neutral-600">
        Page {page} of {totalPages}
      </p>
      <Button
        type="button"
        variant="secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-600">{hint}</p>}
    </Card>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <p className="text-sm text-neutral-600">
        We couldn&apos;t load this section right now.
      </p>
      <Button type="button" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </Card>
  );
}

function OverviewSection() {
  const query = useAdminAnalytics();

  if (query.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <ErrorCard onRetry={() => void query.refetch()} />;
  }

  const { households, helpers, verifiedHelpers, totalBookings, bookingsByStatus, avgRating } =
    query.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Households" value={households} />
        <StatCard label="Helpers" value={helpers} />
        <StatCard label="Verified helpers" value={verifiedHelpers} />
        <StatCard label="Total bookings" value={totalBookings} />
        <StatCard label="Average rating" value={avgRating.toFixed(2)} />
      </div>
      <Card className="p-4">
        <h2 className="font-semibold text-neutral-800">Bookings by status</h2>
        <div className="mt-4 space-y-3">
          {BOOKING_STATUS_VALUES.map((status) => {
            const count = bookingsByStatus[status] ?? 0;
            const pct = totalBookings ? Math.round((count / totalBookings) * 100) : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-neutral-600">
                  {BOOKING_STATUS_LABELS[status]}
                </span>
                <div className="h-2 flex-1 rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-primary-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-medium text-neutral-800">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function PendingRow({ helper }: { helper: AdminHelperItem }) {
  const { mutate, isPending, error } = useAdminHelpersDecision();

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={helper.fullName} src={helper.avatarUrl} />
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-800">{helper.fullName}</p>
            <p className="truncate text-sm text-neutral-600">{helper.email}</p>
            <p className="text-sm text-neutral-600">
              {helper.city} · {SERVICE_TYPE_LABELS[helper.serviceType]} ·{' '}
              {helper.experienceYears} yr exp
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            onClick={() => mutate({ id: helper.id, action: 'verify' })}
            isLoading={isPending}
          >
            Verify
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => mutate({ id: helper.id, action: 'reject' })}
            isLoading={isPending}
          >
            Reject
          </Button>
        </div>
      </div>
      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error.message}
        </p>
      )}
    </Card>
  );
}

function PendingSection() {
  const query = usePendingHelpers();

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return <ErrorCard onRetry={() => void query.refetch()} />;
  }

  const helpers = query.data ?? [];
  if (helpers.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-neutral-600">
          All helper verifications are up to date. Nothing pending.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {helpers.map((helper) => (
        <PendingRow key={helper.id} helper={helper} />
      ))}
    </div>
  );
}

function userDisplayName(user: AdminUserItem): string {
  return (
    user.householdProfile?.fullName ??
    user.helperProfile?.fullName ??
    user.email
  );
}

function UsersSection() {
  const [page, setPage] = useState(1);
  const query = useAdminUsers(page);

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <ErrorCard onRetry={() => void query.refetch()} />;
  }

  const { items, totalPages } = query.data;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="divide-y divide-neutral-100">
          {items.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-800">
                  {userDisplayName(user)}
                </p>
                <p className="truncate text-sm text-neutral-600">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-neutral-100 text-neutral-600">
                  {ROLE_LABELS[user.role]}
                </Badge>
                <Badge
                  className={
                    user.onboardingCompleted
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-amber-100 text-amber-800'
                  }
                >
                  {user.onboardingCompleted ? 'Onboarded' : 'Pending'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

function BookingsSection() {
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [page, setPage] = useState(1);
  const query = useAdminBookings({
    status: status || undefined,
    page,
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (query.isError || !query.data) {
    return <ErrorCard onRetry={() => void query.refetch()} />;
  }

  const { items, totalPages } = query.data;

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Select
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as BookingStatus | '');
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {BOOKING_STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {BOOKING_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>
      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-600">No bookings match this filter.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

const disputeStatusClasses: Record<DisputeStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-800',
  IN_REVIEW: 'bg-primary-100 text-primary-700',
  RESOLVED: 'bg-primary-100 text-primary-700',
  DISMISSED: 'bg-neutral-100 text-neutral-600',
};

const disputeResolutionSchema = z.object({
  resolution: z.string().trim().min(3, 'Describe the resolution').max(1000),
});

function DisputeRow({ dispute }: { dispute: AdminDisputeItem }) {
  const { mutate, isPending, error } = useResolveDispute();
  const { register, handleSubmit, formState: { errors } } = useForm<{
    resolution: string;
  }>({
    resolver: standardSchemaResolver(disputeResolutionSchema),
    defaultValues: { resolution: '' },
  });
  const [resolved, setResolved] = useState(false);

  const canAct = dispute.status === 'OPEN' || dispute.status === 'IN_REVIEW';
  const party =
    dispute.booking.helper?.fullName ??
    dispute.booking.household?.fullName ??
    'Unknown';

  const resolve = (status: 'RESOLVED' | 'DISMISSED') =>
    handleSubmit(({ resolution }) =>
      mutate(
        { id: dispute.id, status, resolution },
        { onSuccess: () => setResolved(true) },
      ),
    )();

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-neutral-800">{party}</p>
          <p className="mt-0.5 text-sm text-neutral-600">
            {dispute.raisedBy.email} · {ROLE_LABELS[dispute.raisedBy.role]}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {formatDate(dispute.booking.scheduledDate)} ·{' '}
            {BOOKING_STATUS_LABELS[dispute.booking.status]}
          </p>
        </div>
        <Badge className={disputeStatusClasses[dispute.status]}>
          {DISPUTE_STATUS_LABELS[dispute.status]}
        </Badge>
      </div>
      <p className="mt-3 text-sm text-neutral-600">{dispute.reason}</p>
      {dispute.status === 'RESOLVED' || dispute.status === 'DISMISSED' ? null : (
        <div className="mt-4 rounded-xl bg-neutral-100 p-3">
          <Textarea
            label="Resolution"
            rows={2}
            placeholder="What did we do about this issue?"
            {...register('resolution')}
            error={errors.resolution?.message}
          />
          {error && (
            <p className="mt-2 text-sm text-danger" role="alert">
              {error.message}
            </p>
          )}
          {canAct && !resolved && (
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                onClick={() => resolve('RESOLVED')}
                isLoading={isPending}
              >
                Mark resolved
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => resolve('DISMISSED')}
                isLoading={isPending}
              >
                Dismiss
              </Button>
            </div>
          )}
          {resolved && (
            <p className="mt-3 rounded-xl bg-primary-100 px-3 py-2 text-sm text-primary-700">
              Dispute updated.
            </p>
          )}
        </div>
      )}
      {dispute.resolution && dispute.status === 'RESOLVED' && (
        <p className="mt-3 rounded-xl bg-primary-100 px-3 py-2 text-sm text-primary-700">
          {dispute.resolution}
        </p>
      )}
    </Card>
  );
}

function DisputesSection() {
  const [status, setStatus] = useState<DisputeStatus | ''>('');
  const [page, setPage] = useState(1);
  const query = useAdminDisputes({
    status: status || undefined,
    page,
  });

  if (query.isLoading) {
    return (
      <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}</div>
    );
  }

  if (query.isError || !query.data) {
    return <ErrorCard onRetry={() => void query.refetch()} />;
  }

  const { items, totalPages } = query.data;

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <Select
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as DisputeStatus | '');
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {DISPUTE_STATUS_VALUES.map((value) => (
            <option key={value} value={value}>
              {DISPUTE_STATUS_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>
      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-600">No disputes match this filter.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((dispute) => (
            <DisputeRow key={dispute.id} dispute={dispute} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default function AdminPage() {
  const [section, setSection] = useState<SectionKey>('overview');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-800">Admin dashboard</h1>
      <nav className="flex flex-wrap gap-2">
        {NAV_SECTIONS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSection(item.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              section === item.key
                ? 'bg-primary-100 text-primary-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {section === 'overview' && <OverviewSection />}
      {section === 'pending' && <PendingSection />}
      {section === 'users' && <UsersSection />}
      {section === 'bookings' && <BookingsSection />}
      {section === 'disputes' && <DisputesSection />}
    </div>
  );
}