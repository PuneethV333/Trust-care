import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Skeleton } from '../ui/Skeleton';
import { Textarea } from '../ui/Textarea';
import {
  useCreateServicePlan,
  useDeleteServicePlan,
  useMyHelperProfile,
  useUpdateServicePlan,
} from '../../hooks/useProfile';
import type { ServicePlan } from '../../schemas/helper.schema';
import { planPrice } from '../../lib/format';
import {
  PLAN_TYPE_LABELS,
  PLAN_TYPE_VALUES,
  type PlanType,
} from '../../types';

function PriceInput({
  label,
  error,
  ...rest
}: React.ComponentProps<typeof Input>) {
  return <Input label={label} type="number" min={0} step="1" error={error} {...rest} />;
}

interface PlanRowProps {
  plan: ServicePlan;
  onUpdated: () => void;
}

function PlanRow({ plan, onUpdated }: PlanRowProps) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(plan.price));
  const [description, setDescription] = useState(plan.description ?? '');
  const updatePlan = useUpdateServicePlan();
  const deletePlan = useDeleteServicePlan();

  const save = () => {
    const nextPrice = Number(price);
    updatePlan.mutate(
      {
        id: plan.id,
        input: {
          price: Number.isNaN(nextPrice) ? 0 : nextPrice,
          description: description.trim() || undefined,
        },
      },
      { onSuccess: () => { setEditing(false); onUpdated(); } },
    );
  };

  const toggleActive = () => {
    updatePlan.mutate(
      { id: plan.id, input: { isActive: !plan.isActive } as unknown as any },
      { onSuccess: onUpdated },
    );
  };

  if (editing) {
    return (
      <div className="space-y-3 py-3">
        <PriceInput
          label="Price (₹)"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
        <Textarea
          label="Description (optional)"
          rows={2}
          maxLength={500}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {updatePlan.error && (
          <p className="text-sm text-danger" role="alert">
            {updatePlan.error.message}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" isLoading={updatePlan.isPending} onClick={save}>
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 py-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-neutral-800">
            {PLAN_TYPE_LABELS[plan.planType]}
          </span>
          <span className="text-sm text-neutral-700">
            {planPrice(plan.planType, plan.price)}
          </span>
          <Badge className={plan.isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'}>
            {plan.isActive ? 'Active' : 'Hidden'}
          </Badge>
        </div>
        {plan.description && (
          <p className="mt-1 text-sm text-neutral-600">{plan.description}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-primary-600 hover:underline"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={toggleActive}
          disabled={updatePlan.isPending}
          className="text-sm text-primary-600 hover:underline disabled:opacity-50"
        >
          {plan.isActive ? 'Hide' : 'Show'}
        </button>
        <button
          type="button"
          onClick={() => deletePlan.mutate(plan.id, { onSuccess: onUpdated })}
          disabled={deletePlan.isPending}
          className="text-sm text-danger hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function ServicePlansSection() {
  const query = useMyHelperProfile();
  const createPlan = useCreateServicePlan();
  const [adding, setAdding] = useState(false);
  const [planType, setPlanType] = useState<PlanType>('HOURLY');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);

  if (query.isLoading) {
    return (
      <Card className="space-y-3 p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }
  if (query.isError || !query.data) return null;

  const plans = query.data.servicePlans;

  const submit = () => {
    const nextPrice = Number(price);
    if (price === '' || Number.isNaN(nextPrice) || nextPrice < 0) {
      setPriceError('Enter a valid price');
      return;
    }
    setPriceError(null);
    createPlan.mutate(
      {
        planType,
        price: Math.round(nextPrice),
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setAdding(false);
          setPrice('');
          setDescription('');
        },
      },
    );
  };

  return (
    <Card className="p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-800">Service plans &amp; pricing</h2>
        {!adding && (
          <Button type="button" variant="secondary" onClick={() => setAdding(true)}>
            Add plan
          </Button>
        )}
      </div>

      <p className="mb-3 text-sm text-neutral-600">
        Set what you charge for each plan type. Active plans are shown to
        households on your public profile.
      </p>

      {adding && (
        <div className="mb-4 space-y-3">
          <Select
            label="Plan type"
            value={planType}
            onChange={(event) => setPlanType(event.target.value as PlanType)}
          >
            {PLAN_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {PLAN_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
          <PriceInput
            label="Price (₹)"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            error={priceError ?? undefined}
          />
          <Textarea
            label="Description (optional)"
            rows={2}
            maxLength={500}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          {createPlan.error && (
            <p className="text-sm text-danger" role="alert">
              {createPlan.error.message}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="button" isLoading={createPlan.isPending} onClick={submit}>
              Save plan
            </Button>
            <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {plans.length === 0 ? (
        <p className="text-sm text-neutral-600">
          No service plans yet — add a plan so households can book you.
        </p>
      ) : (
        <div className="divide-y divide-neutral-100">
          {plans.map((plan) => (
            <PlanRow key={plan.id} plan={plan} onUpdated={() => { /* cache invalidation handles refetch */ }} />
          ))}
        </div>
      )}
    </Card>
  );
}
