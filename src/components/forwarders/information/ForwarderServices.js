// components/forwarders/information/ForwarderServices.js
import { Badge } from "@/components/ui/badge";

const ForwarderServices = ({ services }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold mb-2">Services</h3>
    <div className="flex flex-wrap gap-2">
      {services.map(service => (
        <Badge key={service} variant="secondary" className="capitalize">
          {service}
        </Badge>
      ))}
    </div>
  </div>
);

export default ForwarderServices;