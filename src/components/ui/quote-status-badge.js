import { Badge } from "@/components/ui/badge";

export function QuoteStatusBadge({ status }) {
  const getVariant = () => {
    switch (status) {
      case 'ACTIVE':
        return { className: 'bg-yellow-500 hover:bg-yellow-600', label: 'Active' };
      case 'SELECTED':
        return { className: 'bg-green-500 hover:bg-green-600', label: 'Selected' };
      case 'REJECTED':
        return { className: 'bg-red-500 hover:bg-red-600', label: 'Rejected' };
      case 'CANCELLED':
        return { className: 'bg-gray-500 hover:bg-gray-600', label: 'Cancelled' };
      case 'EXPIRED':
        return { className: 'bg-amber-500 hover:bg-amber-600', label: 'Expired' };
      default:
        return { className: 'bg-blue-500 hover:bg-blue-600', label: status };
    }
  };

  const { className, label } = getVariant();

  return (
    <Badge className={className}>
      {label}
    </Badge>
  );
} 