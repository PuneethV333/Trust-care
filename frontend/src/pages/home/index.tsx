import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
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
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-semibold text-neutral-800">Welcome back</h1>
        <p className="mt-2 text-neutral-600">
          Your profile is live. New booking requests from households will show up on
          the bookings tab.
        </p>
        <Link to="/profile" className="inline-block">
          <Button className="mt-4">View my profile</Button>
        </Link>
      </Card>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'HELPER') return <HelperHome />;
  return <HouseholdHome />;
}