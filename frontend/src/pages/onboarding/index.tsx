import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_VALUES } from '../../types';
import {
  helperOnboardingInputSchema,
  type HelperProfile,
} from '../../schemas/helper.schema';
import {
  householdOnboardingSchema,
  type HouseholdProfileInput,
} from '../../schemas/user.schema';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';

type HelperFormValues = Omit<
  z.infer<typeof helperOnboardingInputSchema>,
  'avatarUrl' | 'availability'
>;

function HouseholdForm({ onDone }: { onDone: () => void }) {
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HouseholdProfileInput>({
    resolver: standardSchemaResolver(householdOnboardingSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post<unknown>('/users/onboarding', values);
      onDone();
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Something went wrong.',
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Full name"
        placeholder="Your name"
        autoComplete="name"
        {...register('fullName')}
        error={errors.fullName?.message}
      />
      <Input
        label="Phone"
        type="tel"
        placeholder="+91 98765 43210"
        autoComplete="tel"
        {...register('phone')}
        error={errors.phone?.message}
      />
      <Input
        label="Address"
        placeholder="House / flat number, street"
        autoComplete="street-address"
        {...register('address')}
        error={errors.address?.message}
      />
      <Input
        label="City"
        placeholder="e.g. Pune"
        autoComplete="address-level2"
        {...register('city')}
        error={errors.city?.message}
      />
      {submitError && (
        <p className="text-sm text-danger" role="alert">
          {submitError}
        </p>
      )}
      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
        Finish setup
      </Button>
    </form>
  );
}

function HelperForm({ onDone }: { onDone: () => void }) {
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HelperFormValues>({
    resolver: standardSchemaResolver(
      helperOnboardingInputSchema.omit({ avatarUrl: true, availability: true }),
    ),
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('');
    setIsSubmitting(true);
    try {
      await api.post<HelperProfile>('/helpers/onboarding', values);
      onDone();
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Something went wrong.',
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Full name"
        placeholder="Your name"
        autoComplete="name"
        {...register('fullName')}
        error={errors.fullName?.message}
      />
      <Input
        label="Phone"
        type="tel"
        placeholder="+91 98765 43210"
        autoComplete="tel"
        {...register('phone')}
        error={errors.phone?.message}
      />
      <Select
        label="Service type"
        {...register('serviceType')}
        error={errors.serviceType?.message}
      >
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
      <Input
        label="City"
        placeholder="e.g. Pune"
        {...register('city')}
        error={errors.city?.message}
      />
      <Textarea
        label="Bio (optional)"
        placeholder="A short introduction households will see"
        rows={3}
        {...register('bio')}
        error={errors.bio?.message}
      />
      {submitError && (
        <p className="text-sm text-danger" role="alert">
          {submitError}
        </p>
      )}
      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
        Finish setup
      </Button>
    </form>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { sync } = useAuth();
  const [step, setStep] = useState<'choose' | 'household' | 'helper'>('choose');

  const finish = async () => {
    const ok = await sync();
    if (ok) navigate('/', { replace: true });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-neutral-800">
        Set up your profile
      </h1>
      <p className="mt-1 text-sm text-neutral-600">
        Tell us a bit about yourself so we can tailor Helper4U for you.
      </p>

      {step === 'choose' && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="text-lg font-semibold text-neutral-800">
              I need help at home
            </h2>
            <p className="flex-1 text-sm text-neutral-600">
              Find and book verified maids and nannies in your city.
            </p>
            <Button type="button" onClick={() => setStep('household')}>
              Continue as household
            </Button>
          </Card>
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="text-lg font-semibold text-neutral-800">
              I provide services
            </h2>
            <p className="flex-1 text-sm text-neutral-600">
              Create your helper profile to start receiving bookings.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep('helper')}
            >
              Continue as helper
            </Button>
          </Card>
        </div>
      )}

      {step === 'household' && (
        <Card className="mt-6 p-6">
          <HouseholdForm onDone={() => void finish()} />
        </Card>
      )}

      {step === 'helper' && (
        <Card className="mt-6 p-6">
          <HelperForm onDone={() => void finish()} />
        </Card>
      )}
    </div>
  );
}
