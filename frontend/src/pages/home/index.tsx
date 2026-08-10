import { Link } from 'react-router-dom';
import { EarningsCard } from '../../components/helper/EarningsCard';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentUser } from '../../hooks/useProfile';
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_VALUES } from '../../types';
import { SearchIcon } from '../../components/ui/icons';

function HouseholdHome() {
  return (
    <div className="space-y-6">
      <Card className="bg-primary-600 p-6 text-white">
        <h1 className="text-2xl font-semibold">Find trusted household help</h1>
        <p className="mt-2 text-primary-100">
          Connect with verified maids and nannies near you — compare rates, check
          reviews, and book in minutes.
        </p>
        <Link to="/search">
          <Button className="mt-4 bg-white text-primary-700 hover:bg-primary-50">
            <SearchIcon className="h-4 w-4" />
            Search helpers
          </Button>
        </Link>
      </Card>

      <section>
        <h2 className="text-lg font-semibold text-neutral-800">Browse by service</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SERVICE_TYPE_VALUES.map((value) => (
            <Link key={value} to="/search" className="block">
              <Card className="p-4 transition-shadow hover:shadow-md">
                <h3 className="font-medium text-neutral-800">
                  {SERVICE_TYPE_LABELS[value]}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Find a trusted {SERVICE_TYPE_LABELS[value].toLowerCase()} in your city.
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function HelperHome() {
  const query = useCurrentUser();

  if (query.isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
      </Card>
    );
  }

  if (query.isError || !query.data?.helperProfile) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-neutral-600">
          We couldn&apos;t load your profile right now.
        </p>
        <Button type="button" variant="secondary" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  const copy = {
    VERIFIED: {
      className: 'bg-primary-600 text-white',
      title: 'Your profile is live',
      kicker: 'Households can now find, review, and book you.',
    },
    PENDING: {
      className: 'bg-accent-500 text-white',
      title: 'Profile under review',
      kicker:
        'Our team is verifying your profile. Upload your ID and address documents from the profile page to speed this up.',
    },
    REJECTED: {
      className: 'bg-danger text-white',
      title: 'Profile needs attention',
      kicker: 'Your profile was not approved. Update your details to submit it for review again.',
    },
  }[query.data.helperProfile.verificationStatus];

  return (
    <div className="space-y-6">
      <Card className={`p-6 ${copy.className}`}>
        <h1 className="text-2xl font-semibold">{copy.title}</h1>
        <p className="mt-2 opacity-90">{copy.kicker}</p>
        <Link to="/profile" className="inline-block">
          <Button className="mt-4 bg-white text-primary-700 hover:bg-primary-50">
            View my profile
          </Button>
        </Link>
      </Card>
      <EarningsCard />
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'HELPER') return <HelperHome />;
  return <HouseholdHome />;
}