import { Badge } from "@/components/ui/badge";
import { Package } from 'lucide-react';

const SERVICE_LABELS = {
  'SEA': 'Sea Freight',
  'AIR': 'Air Freight',
};

const STATUS_STYLES = {
  active: 'bg-green-500 hover:bg-green-600',
  inactive: 'bg-gray-500 hover:bg-gray-600',
  blacklisted: 'bg-red-500 hover:bg-red-600'
};

export function FreightStatusIndicator({ 
  status,
  showDot = false,
  size = 'default', // 'default' or 'sm'
  variant = "secondary",
  className = ""
}) {
  const normalizedStatus = status?.toLowerCase() || 'unknown';
  const statusStyle = STATUS_STYLES[normalizedStatus] || STATUS_STYLES.inactive;
  const sizeClasses = {
    default: "px-3 py-1",
    sm: "px-2 py-0.5 text-xs"
  };

  return (
    <div className="flex items-center gap-2">
      {!showDot ? (
        <Badge 
          key={normalizedStatus}
          variant={variant} 
          className={`capitalize ${statusStyle} text-white ${sizeClasses[size]} ${className}`}
        >
          {normalizedStatus}
        </Badge>
      ) : (
        <div className={`w-2 h-2 rounded-full ${statusStyle}`} />
      )}
    </div>
  );
}

export function FreightServiceTags({ 
  services = [], 
  showIcon = true, 
  className = "",
  variant = "secondary",
  size = "default" // 'default' or 'sm'
}) {
  const sizeClasses = {
    default: "px-3 py-1",
    sm: "px-2 py-0.5 text-xs"
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {showIcon && (
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Services
        </h3>
      )}
      <div className="flex flex-wrap gap-2">
        {services.length > 0 ? (
          services.map(service => (
            <Badge 
              key={service} 
              variant={variant}
              className={`capitalize ${sizeClasses[size]}`}
            >
              {SERVICE_LABELS[service] || service}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-gray-500">No services listed</span>
        )}
      </div>
    </div>
  );
} 