import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { useCreateDispute } from '../../hooks/useBookings';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';

const disputeFormSchema = z.object({
  reason: z.string().trim().min(5, 'Describe the issue').max(1000),
});

type DisputeFormValues = z.infer<typeof disputeFormSchema>;

export function DisputeForm({
  bookingId,
  onSubmitted,
}: {
  bookingId: string;
  onSubmitted: () => void;
}) {
  const { mutate, isPending, error } = useCreateDispute();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DisputeFormValues>({
    resolver: standardSchemaResolver(disputeFormSchema),
    defaultValues: { reason: '' },
  });

  const onSubmit = handleSubmit((values) => {
    mutate({ bookingId, reason: values.reason }, { onSuccess: onSubmitted });
  });

  return (
    <form onSubmit={onSubmit} className="rounded-xl bg-neutral-100 p-4">
      <Textarea
        label="Describe the issue"
        rows={3}
        placeholder="What happened with this booking?"
        {...register('reason')}
        error={errors.reason?.message}
      />
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error.message}
        </p>
      )}
      <Button type="submit" isLoading={isPending} className="mt-3">
        Report issue
      </Button>
    </form>
  );
}