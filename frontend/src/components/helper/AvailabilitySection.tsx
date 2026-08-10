import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useMyHelperProfile, useUpdateAvailability } from '../../hooks/useProfile';
import type { Availability } from '../../schemas/helper.schema';
import { DAY_LABELS, DAY_VALUES, type Day } from '../../types';

const EMPTY_AVAILABILITY: Availability = Object.fromEntries(
  DAY_VALUES.map((day) => [day, []]),
) as Availability;

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatSlot(start: string, end: string): string {
  return `${start}-${end}`;
}

function validateSlot(slot: string, existing: string[]): string | null {
  const match = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(slot);
  if (!match) return 'Use HH:MM-HH:MM';
  const start = toMinutes(match[1]);
  const end = toMinutes(match[2]);
  if (Number.isNaN(start) || Number.isNaN(end)) return 'Invalid time';
  if (start >= end) return 'End time must be after start time';
  if (existing.some((entry) => entry === slot)) return 'This slot is already added';
  const [startHour, startMinute] = match[1].split(':').map(Number);
  const [endHour, endMinute] = match[2].split(':').map(Number);
  const overlap = existing.some((entry) => {
    const other = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(entry);
    if (!other) return false;
    const oStart = toMinutes(other[1]);
    const oEnd = toMinutes(other[2]);
    const s = startHour * 60 + startMinute;
    const e = endHour * 60 + endMinute;
    return s < oEnd && oStart < e;
  });
  if (overlap) return 'Slots cannot overlap';
  return null;
}

interface DayRowProps {
  day: Day;
  slots: string[];
  onChange: (slots: string[]) => void;
  onError: (message: string | null) => void;
}

function DayRow({ day, slots, onChange, onError }: DayRowProps) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addSlot = () => {
    if (!start || !end) {
      setError('Pick a start and end time');
      return;
    }
    const slot = formatSlot(start, end);
    const message = validateSlot(slot, slots);
    if (message) {
      setError(message);
      return;
    }
    onChange([...slots, slot]);
    setStart('');
    setEnd('');
    setError(null);
    onError(null);
  };

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-24 text-sm font-medium text-neutral-800">
          {DAY_LABELS[day]}
        </span>
        {slots.map((slot) => (
          <span
            key={slot}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-700"
          >
            {slot}
            <button
              type="button"
              aria-label={`Remove ${slot}`}
              onClick={() => onChange(slots.filter((entry) => entry !== slot))}
              className="text-neutral-400 hover:text-danger"
            >
              ×
            </button>
          </span>
        ))}
        {slots.length === 0 && (
          <span className="text-sm text-neutral-400">Not set</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="time"
          aria-label={`${DAY_LABELS[day]} start`}
          value={start}
          onChange={(event) => setStart(event.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        />
        <span className="text-sm text-neutral-400">to</span>
        <input
          type="time"
          aria-label={`${DAY_LABELS[day]} end`}
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        />
        <button
          type="button"
          onClick={addSlot}
          className="text-sm text-primary-600 hover:underline"
        >
          Add slot
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function AvailabilitySection() {
  const query = useMyHelperProfile();
  const update = useUpdateAvailability();
  const [draft, setDraft] = useState<Availability>(EMPTY_AVAILABILITY);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data || loaded) return;
    setDraft({ ...EMPTY_AVAILABILITY, ...query.data.availability });
    setLoaded(true);
  }, [query.data, loaded]);

  const changed = useMemo(
    () =>
      DAY_VALUES.some(
        (day) =>
          (draft[day]?.length ?? 0) !== (query.data?.availability[day]?.length ?? 0) ||
          (draft[day] ?? []).some(
            (slot) => !(query.data?.availability[day] ?? []).includes(slot),
          ),
      ),
    [draft, query.data],
  );

  const save = () => {
    update.mutate(
      { availability: draft },
      {
        onSuccess: () => {
          setError(null);
          setLoaded(false);
        },
      },
    );
  };

  const reset = () => {
    if (query.data) {
      setDraft({ ...EMPTY_AVAILABILITY, ...query.data.availability });
    }
    setError(null);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-neutral-800">Availability</h2>
      <p className="mb-2 mt-1 text-sm text-neutral-600">
        Set the days and time ranges you can work. Households filter search
        results by these slots.
      </p>
      <div className="divide-y divide-neutral-100">
        {DAY_VALUES.map((day) => (
          <DayRow
            key={day}
            day={day}
            slots={draft[day] ?? []}
            onChange={(slots) => setDraft((current) => ({ ...current, [day]: slots }))}
            onError={setError}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {update.error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {update.error.message}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={save} isLoading={update.isPending} disabled={!changed}>
          Save availability
        </Button>
        <Button type="button" variant="secondary" onClick={reset} disabled={!changed}>
          Discard changes
        </Button>
      </div>
    </Card>
  );
}