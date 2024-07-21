import React, { useState } from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, StickyNote } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import StarRating from './StarRating';
import PriceHistoryDialog from './PriceHistoryDialog';
import { shipmentTypes } from '@/config/shipmentConfig';
import TransitRoute from './TransitRoute';

const generatePriceHistory = (currentPrice, agentId) => {
    const history = [];
    let price = currentPrice;
    const seed = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
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
  const priceHistory = generatePriceHistory(quotation.price, quotation.agentId);
  const previousPrice = priceHistory[priceHistory.length - 2].price;
  const priceChange = ((quotation.price - previousPrice) / previousPrice) * 100;
  const hasAmendment = quotation.amendments > 0;

  const renderShipmentSpecificFields = () => {
    const shipmentType = shipmentTypes[order.shipmentType];
    if (!shipmentType) return null;

    return (
      <div className="grid grid-cols-3 gap-4 mt-4">
        {shipmentType.fields.map((field) => (
          <div key={field.key}>
            <p className="text-sm font-medium">{field.label}</p>
            <p>{field.format ? field.format(quotation[field.key]) : quotation[field.key]}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <TableRow className="group hover:bg-muted/50">
        <TableCell>
          <div className="font-medium">{quotation.agentCompany}</div>
        </TableCell>
        <TableCell>
          <StarRating rating={quotation.rating} />
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <span className="font-semibold">${quotation.price.toLocaleString()}</span>
            {hasAmendment ? (
              <PriceHistoryDialog 
                agentCompany={quotation.agentCompany} 
                priceHistory={priceHistory}
                priceChange={priceChange}
              />
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        </TableCell>
        <TableCell>{quotation.estimatedTime} days</TableCell>
        <TableCell>
          <TransitRoute order={order} quotation={quotation} />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end space-x-2">
           {
            quotation.note ? (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <StickyNote className="h-4 w-4" />
                </HoverCardTrigger>
                <HoverCardContent>
                  <p className="text-sm">{quotation.note}</p>
                </HoverCardContent>
              </HoverCard>
            ) : null
            }
            <Button
              variant="ghost"
              size="sm"
              className="px-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {order.status === 'pending' && (
              <Button onClick={() => onSelectAgent(quotation.agentId)} size="sm" variant="default">
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
