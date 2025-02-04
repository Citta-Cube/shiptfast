import React, { useState } from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, StickyNote } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import StarRating from './StarRating';
import PriceHistoryDialog from './PriceHistoryDialog';
import { shipmentTypes } from '@/config/shipmentConfig';
import TransitRoute from './TransitRoute';

const generatePriceHistory = (currentPrice, quoteId) => {
    const history = [];
    let price = currentPrice;
    const seed = quoteId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    for (let i = 3; i >= 0; i--) {
      history.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: Math.round(price * 100) / 100
      });
      const change = (Math.sin(seed + i) * 200) - 100;
      price += change;
      price = Math.max(price, 0);
    }
    return history;
};

const QuotationRow = ({ quotation, order, onSelectAgent }) => {
  const [expanded, setExpanded] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const priceHistory = generatePriceHistory(quotation.net_freight_cost, quotation.id);
  const previousPrice = priceHistory[priceHistory.length - 2].price;
  const priceChange = ((quotation.net_freight_cost - previousPrice) / previousPrice) * 100;

  const renderShipmentSpecificFields = () => {
    const shipmentType = shipmentTypes[order.shipment_type];
    if (!shipmentType) return null;

    return (
      <div className="grid grid-cols-3 gap-4 mt-4">
        {shipmentType.fields.map((field) => (
          <div key={field.key}>
            <p className="text-sm font-medium">{field.label}</p>
            <p>{field.format ? 
              field.format(quotation.quote_details[field.key]) : 
              quotation.quote_details[field.key]}</p>
          </div>
        ))}
        <div>
          <p className="text-sm font-medium">Container Type</p>
          <p>{order.order_details.containerType}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <TableRow className="group hover:bg-muted/50">
        <TableCell>
          <div className="font-medium">{quotation.companies.name}</div>
        </TableCell>
        <TableCell>
          <StarRating rating={quotation.companies.average_rating || 0} />
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">${quotation.net_freight_cost.toLocaleString()}</span>
            <PriceHistoryDialog 
              agentCompany={quotation.companies.name} 
              priceHistory={priceHistory}
              priceChange={priceChange}
            />
          </div>
        </TableCell>
        <TableCell>{quotation.estimated_time_days} days</TableCell>
        <TableCell>
          <TransitRoute 
            origin={order?.origin_port?.port_code}
            destination={order?.destination_port?.port_code}
            transshipmentPorts={quotation?.transshipment_ports}
          />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end space-x-2">
           {quotation.note && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <StickyNote className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <h3 className="text-lg font-semibold mb-2">Note</h3>
                  <p className="text-sm">{quotation.note}</p>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {order.status === 'OPEN' && (
              <Button 
                onClick={() => onSelectAgent(quotation.freight_forwarder_id)} 
                size="sm" 
                variant="default"
              >
                Select
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={6}>
            <div className="p-4 bg-muted rounded-md">
              {renderShipmentSpecificFields()}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default QuotationRow;
