// components/forwarders/information/ForwarderHeader.js
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from 'lucide-react';

const ForwarderHeader = ({ forwarder, getStatusColor }) => (
  <div className="flex items-start justify-between mb-6">
    <div className="flex items-center space-x-4">
      <Avatar className="h-24 w-24 rounded-lg">
        <AvatarImage src={forwarder.logo} alt={forwarder.name} />
        <AvatarFallback className="text-2xl font-bold">{forwarder.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <h2 className="text-2xl font-bold">{forwarder.name}</h2>
        <div className="flex items-center mt-2">
          <Badge variant="outline" className={`capitalize ${getStatusColor(forwarder.status)} text-white mr-2`}>
            {forwarder.status}
          </Badge>
          {forwarder.isVerified && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Verified
            </Badge>
          )}
        </div>
      </div>
    </div>
    <div className="text-right">
      <div className="flex items-center">
        <Star className="h-6 w-6 text-yellow-400 mr-1" />
        <span className="text-2xl font-semibold">{forwarder.rating.toFixed(1)}</span>
      </div>
      <span className="text-sm text-gray-500">({forwarder.ordersCompleted} orders)</span>
    </div>
  </div>
);

export default ForwarderHeader;