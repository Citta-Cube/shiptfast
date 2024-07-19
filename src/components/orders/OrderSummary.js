import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Ship, Plane, Package, Box, CircleX } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const OrderSummary = ({ order, onCancelOrder }) => {
  const ShipmentTypeIcon = order.shipmentType === 'sea' ? Ship : Plane;
  const LoadTypeIcon = order.loadType === 'FCL' ? Box : Package;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Order Summary</CardTitle>
        {order.status !== 'cancelled' && (
            <Button variant="ghost" className="hover:bg-muted/50"><CircleX className="w-6 h-6 text-red-500" /></Button>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium">Shipment Date</p>
          <p>{order.shipmentDate}</p>
        </div>
        <div>
          <p className="text-sm font-medium">Status</p>
          <Badge>{order.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <ShipmentTypeIcon className="h-4 w-4" />
          <p>{order.shipmentType.toUpperCase()} Freight</p>
        </div>
        <div className="flex items-center gap-2">
          <LoadTypeIcon className="h-4 w-4" />
          <p>{order.loadType}</p>
        </div>
        <div className="col-span-2 flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://flagcdn.com/w20/${order.originCountryCode.toLowerCase()}.png`} />
              <AvatarFallback>{order.originCountryCode}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{order.originPort}</span>
            <span className="text-sm">→</span>
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://flagcdn.com/w20/${order.destinationCountryCode.toLowerCase()}.png`} />
              <AvatarFallback>{order.destinationCountryCode}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{order.destinationPort}</span>
        </div>
        <div>
          <p className="text-sm font-medium">Incoterm</p>
          <p>{order.incoterm}</p>
        </div>
        {/* Render additional fields based on shipment type */}
        {order.shipmentType === 'air' && (
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
        )}
      </CardContent>
    </Card>
  );
};

export default OrderSummary;