import { useState, type FormEvent } from 'react';
import { HelperCard } from '../../components/helper/HelperCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { Select } from '../../components/ui/Select';
import { useHelperSearch } from '../../hooks/useHelpers';
import {
  DAY_LABELS,
  DAY_VALUES,
  PLAN_TYPE_LABELS,
  PLAN_TYPE_VALUES,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_VALUES,
  TIME_SLOT_LABELS,
  TIME_SLOT_VALUES,
  type Day,
  type PlanType,
  type ServiceType,
  type TimeSlot,
} from '../../types';

interface Draft {
  type: string;
  city: string;
  minExperience: string;
  planType: string;
  day: string;
  timeSlot: string;
}

interface Applied {
  type?: ServiceType;
  city?: string;
  minExperience?: number;
  planType?: PlanType;
  day?: Day;
  timeSlot?: TimeSlot;
}

const initialDraft: Draft = {
  type: '',
  city: '',
  minExperience: '',
  planType: '',
  day: '',
  timeSlot: '',
};

function ResultSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SearchPage() {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [applied, setApplied] = useState<Applied | null>(null);
  const [page, setPage] = useState(1);

  const query = useHelperSearch({ ...(applied ?? {}), page });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setApplied({
      type: (draft.type || undefined) as ServiceType | undefined,
      city: draft.city.trim() || undefined,
      minExperience: draft.minExperience ? Number(draft.minExperience) : undefined,
      planType: (draft.planType || undefined) as PlanType | undefined,
      day: (draft.day || undefined) as Day | undefined,
      timeSlot: (draft.timeSlot || undefined) as TimeSlot | undefined,
    });
    setPage(1);
  };

  const reset = () => {
    setDraft(initialDraft);
    setApplied(null);
    setPage(1);
  };

  const results = query.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-800">Find a helper</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Search verified maids and nannies near you.
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Select
            label="Service type"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value })}
          >
            <option value="">Any</option>
            {SERVICE_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {SERVICE_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
          <Select
            label="Plan type"
            value={draft.planType}
            onChange={(e) => setDraft({ ...draft, planType: e.target.value })}
          >
            <option value="">Any</option>
            {PLAN_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {PLAN_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
          <Input
            label="City"
            placeholder="e.g. Pune"
            value={draft.city}
            onChange={(e) => setDraft({ ...draft, city: e.target.value })}
          />
          <Input
            label="Min. experience (years)"
            type="number"
            min={0}
            placeholder="e.g. 2"
            value={draft.minExperience}
            onChange={(e) => setDraft({ ...draft, minExperience: e.target.value })}
          />
          <Select
            label="Available day"
            value={draft.day}
            onChange={(e) => setDraft({ ...draft, day: e.target.value })}
          >
            <option value="">Any day</option>
            {DAY_VALUES.map((value) => (
              <option key={value} value={value}>
                {DAY_LABELS[value]}
              </option>
            ))}
          </Select>
          <Select
            label="Time slot"
            value={draft.timeSlot}
            onChange={(e) => setDraft({ ...draft, timeSlot: e.target.value })}
          >
            <option value="">Any time</option>
            {TIME_SLOT_VALUES.map((value) => (
              <option key={value} value={value}>
                {TIME_SLOT_LABELS[value]}
              </option>
            ))}
          </Select>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
            <Button type="submit" className="flex-1">
              Search
            </Button>
            <Button type="button" variant="secondary" onClick={reset}>
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {query.isLoading && !results && <ResultSkeleton />}

      {query.isError && (
        <Card className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm text-neutral-600">
            We couldn&apos;t load helpers right now.
          </p>
          <Button type="button" variant="secondary" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </Card>
      )}

      {results && results.items.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-neutral-600">
            No helpers match these filters yet. Try clearing a filter or widening your search.
          </p>
        </Card>
      )}

      {results && results.items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.items.map((helper) => (
              <HelperCard key={helper.id} helper={helper} />
            ))}
          </div>
          {results.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <p className="text-sm text-neutral-600">
                Page {results.page} of {results.totalPages}
              </p>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= results.totalPages}
                onClick={() => setPage((p) => Math.min(results.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}