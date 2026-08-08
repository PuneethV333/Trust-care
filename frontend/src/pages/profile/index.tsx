import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../types';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <Avatar name="You" className="h-16 w-16 text-lg" />
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">Your account</h1>
          <p className="mt-2 inline-block rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-primary-700">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <Button variant="danger" onClick={() => void signOut()} className="mt-2">
          Sign out
        </Button>
      </Card>
      <Card className="p-8 text-center">
        <p className="text-sm text-neutral-600">
          Profile management will be available in the next phase.
        </p>
      </Card>
    </div>
  );
}