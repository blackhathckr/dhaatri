import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS } from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] || 'bg-[#E0DDD6] text-[#6B7F75]';
  const displayLabel = label || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <Badge className={`${colorClass} border-0 text-xs font-semibold`}>
      {displayLabel}
    </Badge>
  );
}
