import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { Textarea } from '../../components/ui/Textarea';
import { useAuth } from '../../hooks/useAuth';
import {
  useCurrentUser,
  useMyHelperProfile,
  useUpdateHelper,
  useUpdateHousehold,
} from '../../hooks/useProfile';
import {
  householdProfileInputSchema,
  type HouseholdProfile,
  type HouseholdProfileInput,
} from '../../schemas/user.schema';
import {
  helperOnboardingInputSchema,
  type HelperProfile,
} from '../../schemas/helper.schema';
import {
  ROLE_LABELS,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_VALUES,
  VERIFICATION_STATUS_LABELS,
  type VerificationStatus,
} from '../../types';

function verificationClasses(status: VerificationStatus) {
  if (status === 'VERIFIED') return 'bg-primary-100 text-primary-700';
  if (status === 'REJECTED') return 'bg-danger/10 text-danger';
  return 'bg-amber-100 text-amber-800';
}

function ProfileRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-neutral-600">{label}</span>
      <span className="text-right text-sm font-medium text-neutral-800">{value}</span>
    </div>
  );
}

function LoadCard() {
  return (
    <Card className="space-y-3 p-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </Card>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <p className="text-sm text-neutral-600">
        We couldn&apos;t load your profile right now.
      </p>
      <Button type="button" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </Card>
  );
}

function HouseholdEditForm({
  profile,
  onDone,
  onCancel,
}: {
  profile: HouseholdProfile;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { mutate, isPending, error } = useUpdateHousehold();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HouseholdProfileInput>({
    resolver: standardSchemaResolver(householdProfileInputSchema),
    defaultValues: {
      fullName: profile.fullName,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
    },
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, { onSuccess: onDone });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Full name"
        autoComplete="name"
        {...register('fullName')}
        error={errors.fullName?.message}
      />
      <Input
        label="Phone"
        type="tel"
        autoComplete="tel"
        {...register('phone')}
        error={errors.phone?.message}
      />
      <Input
        label="Address"
        autoComplete="street-address"
        {...register('address')}
        error={errors.address?.message}
      />
      <Input
        label="City"
        autoComplete="address-level2"
        {...register('city')}
        error={errors.city?.message}
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" isLoading={isPending}>
          Save changes
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function HouseholdSection() {
  const query = useCurrentUser();
  const [editing, setEditing] = useState(false);

  if (query.isLoading) return <LoadCard />;
  if (query.isError || !query.data?.householdProfile) {
    return <ErrorCard onRetry={() => void query.refetch()} />;
  }

  const profile = query.data.householdProfile;

  if (editing) {
    return (
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-800">
          Edit household profile
        </h2>
        <HouseholdEditForm
          profile={profile}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-800">Your details</h2>
        <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
      <div className="divide-y divide-neutral-100">
        <ProfileRow label="Email" value={query.data.email} />
        <ProfileRow label="Phone" value={profile.phone} />
        <ProfileRow label="Address" value={profile.address} />
        <ProfileRow label="City" value={profile.city} />
      </div>
    </Card>
  );
}

type HelperFormValues = Omit<
  z.infer<typeof helperOnboardingInputSchema>,
  'avatarUrl' | 'availability'
>;

function HelperEditForm({
  profile,
  onDone,
  onCancel,
}: {
  profile: HelperProfile;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { mutate, isPending, error } = useUpdateHelper();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HelperFormValues>({
    resolver: standardSchemaResolver(
      helperOnboardingInputSchema.omit({ avatarUrl: true, availability: true }),
    ),
    defaultValues: {
      fullName: profile.fullName,
      phone: profile.phone,
      serviceType: profile.serviceType,
      experienceYears: profile.experienceYears,
      bio: profile.bio ?? '',
      city: profile.city,
    },
  });

  const onSubmit = handleSubmit((values) => {
    mutate(values, { onSuccess: onDone });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Full name"
        autoComplete="name"
        {...register('fullName')}
        error={errors.fullName?.message}
      />
      <Input
        label="Phone"
        type="tel"
        autoComplete="tel"
        {...register('phone')}
        error={errors.phone?.message}
      />
      <Select label="Service type" {...register('serviceType')} error={errors.serviceType?.message}>
        {SERVICE_TYPE_VALUES.map((value) => (
          <option key={value} value={value}>
            {SERVICE_TYPE_LABELS[value]}
          </option>
        ))}
      </Select>
      <Input
        label="Years of experience"
        type="number"
        min={0}
        max={60}
        {...register('experienceYears', { valueAsNumber: true })}
        error={errors.experienceYears?.message}
      />
      <Input label="City" {...register('city')} error={errors.city?.message} />
      <Textarea
        label="Bio"
        rows={3}
        {...register('bio')}
        error={errors.bio?.message}
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" isLoading={isPending}>
          Save changes
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function HelperSection() {
  const query = useMyHelperProfile();
  const [editing, setEditing] = useState(false);

  if (query.isLoading) return <LoadCard />;
  if (query.isError || !query.data) {
    return <ErrorCard onRetry={() => void query.refetch()} />;
  }

  const profile = query.data;

  if (editing) {
    return (
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-800">
          Edit helper profile
        </h2>
        <HelperEditForm profile={profile} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-800">Service details</h2>
        <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
      <div className="divide-y divide-neutral-100">
        <ProfileRow label="Service type" value={SERVICE_TYPE_LABELS[profile.serviceType]} />
        <ProfileRow label="Experience" value={`${profile.experienceYears} yr${profile.experienceYears === 1 ? '' : 's'}`} />
        <ProfileRow label="City" value={profile.city} />
        <ProfileRow label="Phone" value={profile.phone} />
        <ProfileRow label="Bio" value={profile.bio || '—'} />
      </div>
    </Card>
  );
}

function AdminSection() {
  return (
    <Card className="p-8 text-center">
      <p className="text-sm text-neutral-600">
        Manage platform verifications, users, bookings, and analytics from the
        admin dashboard.
      </p>
      <Link to="/admin" className="mt-3 inline-block">
        <Button>Open admin dashboard</Button>
      </Link>
    </Card>
  );
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const accountQuery = useCurrentUser();
  const helperQuery = useMyHelperProfile(user?.role === 'HELPER');

  if (!user) return null;

  const displayName =
    user.role === 'HOUSEHOLD'
      ? accountQuery.data?.householdProfile?.fullName
      : user.role === 'HELPER'
        ? helperQuery.data?.fullName
        : accountQuery.data?.email;
  const avatarUrl =
    user.role === 'HOUSEHOLD'
      ? accountQuery.data?.householdProfile?.avatarUrl
      : helperQuery.data?.avatarUrl;

  return (
    <div className="space-y-6">
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <Avatar name={displayName ?? 'You'} src={avatarUrl} className="h-16 w-16 text-lg" />
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">
            {displayName ?? 'Your account'}
          </h1>
          {accountQuery.data?.email && (
            <p className="mt-1 text-sm text-neutral-600">{accountQuery.data.email}</p>
          )}
          <div className="mt-2 flex items-center justify-center gap-2">
            <Badge className="bg-neutral-100 text-neutral-600">
              {ROLE_LABELS[user.role]}
            </Badge>
            {user.role === 'HELPER' && helperQuery.data && (
              <Badge className={verificationClasses(helperQuery.data.verificationStatus)}>
                {VERIFICATION_STATUS_LABELS[helperQuery.data.verificationStatus]}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {user.role === 'HOUSEHOLD' && <HouseholdSection />}
      {user.role === 'HELPER' && <HelperSection />}
      {user.role === 'ADMIN' && !accountQuery.isLoading && <AdminSection />}

      <Card className="p-6 text-center">
        <Button variant="danger" onClick={() => void signOut()}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}