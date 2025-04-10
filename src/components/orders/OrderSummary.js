import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Ship, Plane, Package, Box, CircleX, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { formatDateTimeToReadable, formatKeyToReadable } from "@/lib/utils";
import { ShipmentTypeIcon, LoadTypeIcon, StatusBadge } from '@/components/dashboard/OrderMetadata';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const OrderSummary = ({ order }) => {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleCancelOrder = async () => {
    try {
      setIsPending(true);
      const response = await fetch(`/api/orders/${order.id}?action=cancel`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel order');
      }

      toast.success("Order Cancelled", {
        description: "The order has been successfully cancelled.",
      });
      
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: error.message,
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle>Order Summary</CardTitle>
          {order.is_urgent && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              URGENT
            </Badge>
          )}
        </div>
        {!['cancelled', 'closed'].includes(order.status.toLowerCase()) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="hover:bg-muted/50"
                disabled={isPending}
              >
                <CircleX className="w-6 h-6 text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel this order? This action cannot be undone.
                  All active quotes will be cancelled and forwarders will be notified.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No, keep it</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelOrder}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      Cancelling...
                    </>
                  ) : (
                    "Yes, cancel order"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium">Cargo Ready Date</p>
          <p>{formatDateTimeToReadable(order.cargo_ready_date)}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Quotation Deadline</p>
          <p>{formatDateTimeToReadable(order.quotation_deadline)}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Status</p>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            {order.is_urgent && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-red-800 bg-red-100 px-2 py-1 rounded-md cursor-help">
                      <AlertTriangle className="h-3 w-3" />
                      Time Sensitive
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-red-50 border-red-200">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-red-700">Urgent Order - Requires Immediate Attention</p>
                      <p className="text-xs text-red-600">Please prioritize processing this order</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShipmentTypeIcon type={order.shipment_type} />
          <p>{order.shipment_type.toUpperCase()} Freight</p>
        </div>
        <div className="flex items-center gap-2">
          <LoadTypeIcon type={order.load_type} />
          <p>{order.load_type}</p>
        </div>
        <div className="col-span-2 flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://flagcdn.com/w20/${order.origin_port?.country_code.toLowerCase()}.png`} />
              <AvatarFallback>{order.origin_port?.country_code}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{order.origin_port?.name}</span>
            <span className="text-sm">→</span>
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://flagcdn.com/w20/${order.destination_port?.country_code.toLowerCase()}.png`} />
              <AvatarFallback>{order.destination_port?.country_code}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{order.destination_port?.name}</span>
        </div>
        <div>
          <p className="text-sm font-medium">Incoterm</p>
          <p>{order.incoterm}</p>
        </div>
        {Object.entries(order.order_details || {}).map(([key, value]) => (
          <div key={key}>
            <p className="text-sm font-medium">{formatKeyToReadable(key)}</p>
            <p>{value}</p>
          </div>
        ))}
        {/* Render additional fields based on shipment type */}
        {/* {order.shipmentType === 'air' && (
          <>
            <div>
              <p className="text-sm font-medium">Gross Weight (kg)</p>
              <p>{order.grossWeight}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Chargeable Weight (kg)</p>
              <p>{order.chargeableWeight}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Dimensions (LxWxH)</p>
              <p>{order.dimensions}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Cargo Type</p>
              <p>{order.cargoType}</p>
            </div>
          </>
        )}
        {order.shipmentType === 'sea' && order.loadType === 'FCL' && (
          <div>
            <p className="text-sm font-medium">Container Type</p>
            <p>{order.containerType}</p>
          </div>
        )}
        {order.shipmentType === 'sea' && order.loadType === 'LCL' && (
          <>
            <div>
              <p className="text-sm font-medium">Pallet CBM</p>
              <p>{order.palletCBM}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Cargo CBM</p>
              <p>{order.cargoCBM}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Gross Weight</p>
              <p>{order.grossWeight}</p>
            </div>
          </>
        )} */}
        
      </CardContent>
    </Card>
  );
};

export default OrderSummary;