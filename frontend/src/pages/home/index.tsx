import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export default function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-neutral-600">Welcome back</p>
          <h1 className="mt-0.5 text-2xl font-semibold text-neutral-800">
            {user ? ROLE_LABELS[user.role] : ''} account
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Your onboarding is complete. Home, search, and bookings arrive in
            the next phases.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void signOut()}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
