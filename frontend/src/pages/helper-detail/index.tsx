import { useParams } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';

export default function HelperDetailPage() {
  const { helperId } = useParams<{ helperId: string }>();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={helperId ?? '?'} className="h-16 w-16 text-lg" />
          <div>
            <h1 className="text-xl font-semibold text-neutral-800">
              Helper profile
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              ID: {helperId ?? 'unknown'}
            </p>
          </div>
        </div>
        <p className="mt-6 rounded-xl bg-neutral-100 p-4 text-sm text-neutral-600">
          Full helper details (bio, services, plans, reviews) and booking will be
          available in the next phase.
        </p>
      </Card>
    </div>
  );
}