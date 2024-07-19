// components/forwarders/QuickStats.js
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Truck, Star } from 'lucide-react';

const QuickStats = ({ forwarder }) => (
  <Card>
    <CardHeader>
      <CardTitle>Quick Stats</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Building className="h-5 w-5 text-gray-400 mr-2" />
            <span>Total Employees</span>
          </div>
          <span className="font-semibold">{forwarder.employees}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Truck className="h-5 w-5 text-gray-400 mr-2" />
            <span>Orders Completed</span>
          </div>
          <span className="font-semibold">{forwarder.ordersCompleted}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Star className="h-5 w-5 text-gray-400 mr-2" />
            <span>Rating</span>
          </div>
          <span className="font-semibold">{forwarder.rating.toFixed(1)}</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default QuickStats;