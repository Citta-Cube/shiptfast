import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Ship, Plane, Package, Box, CircleX, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"
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
          <p className="text-sm font-small text-muted-foreground">{formatDateTimeToReadable(order.cargo_ready_date)}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Quotation Deadline</p>
          <p className="text-sm font-small text-muted-foreground">{formatDateTimeToReadable(order.quotation_deadline)}</p>
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
          <p className="text-sm font-small text-muted-foreground">{order.incoterm}</p>
        </div>
        {order.note && (
          <div className={`col-span-2 ${order.note_is_important ? 'bg-amber-50 border border-amber-200 p-3 rounded-lg' : ''}`}>
            <div className="flex items-start gap-2">
              {order.note_is_important && (
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${order.note_is_important ? 'text-amber-900' : ''}`}>
                  {order.note_is_important ? 'Important Note' : 'Order Note'}
                </p>
                <p className={`text-sm mt-1 whitespace-pre-wrap ${order.note_is_important ? 'text-amber-800' : 'text-muted-foreground'}`}>
                  {order.note}
                </p>
              </div>
            </div>
          </div>
        )}
        {Object.entries(order.order_details || {}).map(([key, value]) => (
          <div key={key} className={key === 'palletizedCargo' ? 'col-span-2' : undefined}>
            <p className="text-sm font-medium">{formatKeyToReadable(key)}</p>
            {key === 'palletizedCargo' && value ? (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">
                  <span className="font-small ">Total Gross Weight: </span>
                  <span>{value.totalGrossWeight?.toFixed(2) || 0} kg</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-small">Total Chargeable Weight: </span>
                  <span>{value.totalChargeableWeight?.toFixed(2) || 0} kg</span>
                </div>
                <div className="py-2">
                </div>
                
                {value.pallets && value.pallets.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Individual Pallets: {value.pallets.length}</p>
                    {value.pallets.map((pallet, index) => (
                      <div key={pallet.id || index}>
                        <div className="text-xs p-3 rounded text-muted-foreground">
                          <div className="flex flex-wrap gap-4">
                            <div>Length: {pallet.length || 0} cm</div>
                            <div>Width: {pallet.width || 0} cm</div>
                            <div>Height: {pallet.height || 0} cm</div>
                            <div>Weight: {pallet.grossWeight || 0} kg</div>
                            <div className="text-gray-500 text-muted-foreground">
                              Chargeable: {pallet.chargeableWeight?.toFixed(2) || 0} kg
                            </div>
                          </div>
                        </div>

                        {/* Add separator except after the last item */}
                        {index < value.pallets.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ) : (
              <p className="text-sm font-small text-muted-foreground">{typeof value === 'object' ? JSON.stringify(value) : value}</p>
            )}
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