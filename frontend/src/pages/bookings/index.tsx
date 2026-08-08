import { Card } from '../../components/ui/Card';

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-800">My bookings</h1>
      <Card className="p-8 text-center">
        <p className="text-sm text-neutral-600">
          Your bookings will appear here. This is coming in the next phase.
        </p>
      </Card>
    </div>
  );
}