import { Link } from 'react-router-dom';
import type { HelperSearchItem } from '../../schemas/helper.schema';
import { SERVICE_TYPE_LABELS } from '../../types';
import { planPrice } from '../../lib/format';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import {
  BriefcaseIcon,
  CheckIcon,
  MapPinIcon,
  StarIcon,
} from '../ui/icons';

export function HelperCard({ helper }: { helper: HelperSearchItem }) {
  const cheapest = helper.servicePlans.length
    ? helper.servicePlans.reduce((lowest, plan) =>
        plan.price < lowest.price ? plan : lowest,
      )
    : null;

  return (
    <Link
      to={`/helpers/${helper.id}`}
      className="block rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex gap-4">
        <Avatar name={helper.fullName} src={helper.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-neutral-800">
              {helper.fullName}
            </h3>
            {helper.verificationStatus === 'VERIFIED' && (
              <Badge className="shrink-0 bg-primary-100 text-primary-700">
                <CheckIcon className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
              {SERVICE_TYPE_LABELS[helper.serviceType]}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="h-3.5 w-3.5" />
              {helper.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <BriefcaseIcon className="h-3.5 w-3.5" />
              {helper.experienceYears} yr{helper.experienceYears === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-sm text-neutral-600">
              <StarIcon className="h-4 w-4 text-accent-500" />
              {helper.ratingCount > 0
                ? `${helper.ratingAvg.toFixed(1)} (${helper.ratingCount})`
                : 'No reviews yet'}
            </span>
            {cheapest && (
              <p className="text-sm text-neutral-800">
                From{' '}
                <span className="font-semibold">
                  {planPrice(cheapest.planType, cheapest.price)}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}