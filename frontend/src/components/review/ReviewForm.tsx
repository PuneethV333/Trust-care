import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { z } from 'zod';
import { useCreateReview } from '../../hooks/useReviews';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { StarRating } from './StarRating';

const reviewFormSchema = z.object({
  rating: z.number().int().min(1, 'Select a rating').max(5),
  comment: z.string().max(500).optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export function ReviewForm({
  bookingId,
  onSubmitted,
}: {
  bookingId: string;
  onSubmitted: () => void;
}) {
  const { mutate, isPending, isSuccess, error } = useCreateReview();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: standardSchemaResolver(reviewFormSchema),
    defaultValues: { rating: 0, comment: '' },
  });
  const rating = watch('rating');

  const onSubmit = handleSubmit((values) => {
    mutate(
      {
        bookingId,
        rating: values.rating,
        comment: values.comment?.trim() || undefined,
      },
      { onSuccess: onSubmitted },
    );
  });

  if (isSuccess) {
    return (
      <p className="rounded-xl bg-primary-100 px-3 py-2 text-sm text-primary-700">
        Thanks! Your review has been submitted.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl bg-neutral-50 p-4">
      <div>
        <span className="text-sm font-medium text-neutral-800">
          How was your experience?
        </span>
        <div className="mt-2">
          <StarRating
            value={rating}
            onChange={(value) => setValue('rating', value, { shouldValidate: true })}
          />
        </div>
        {errors.rating && (
          <span className="mt-1 block text-sm text-danger">
            {errors.rating.message}
          </span>
        )}
      </div>
      <Textarea
        label="Comment (optional)"
        rows={2}
        placeholder="Share what went well — or what could improve"
        {...register('comment')}
        error={errors.comment?.message}
        className="mt-3"
      />
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error.message}
        </p>
      )}
      <Button type="submit" isLoading={isPending} className="mt-3">
        Submit review
      </Button>
    </form>
  );
}