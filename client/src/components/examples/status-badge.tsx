import { StatusBadge } from '../status-badge';

export default function StatusBadgeExample() {
  return (
    <div className="flex gap-2 p-4">
      <StatusBadge status="online" />
      <StatusBadge status="offline" />
      <StatusBadge status="degraded" />
      <StatusBadge status="unknown" />
    </div>
  );
}
