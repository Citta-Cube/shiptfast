import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Download, Star, StarHalf } from 'lucide-react';

// Deterministic function to generate price history
const generatePriceHistory = (currentPrice, agentId) => {
  const history = [];
  let price = currentPrice;
  const seed = agentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = 3; i >= 0; i--) {
    history.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: Math.round(price * 100) / 100
    });
    // Deterministic price change based on seed and iteration
    const change = (Math.sin(seed + i) * 200) - 100;
    price += change;
    price = Math.max(price, 0); // Ensure price doesn't go negative
  }
  return history;
};

const exportToCSV = (quotations, order) => {
  const sortedQuotations = [...quotations].sort((a, b) => a.price - b.price);
  const headers = ["Agent", "Rating", "Price", "Price Discount", "Estimated Time", "Route"];
  const rows = sortedQuotations.map(q => [
    q.agentCompany,
    q.rating.toFixed(1),
    `$${q.price}`,
    q.priceDiscount ? `${q.priceDiscount}%` : '',
    `${q.estimatedTime} days`,
    `${order.originPort} → ${q.transhipmentPorts ? q.transhipmentPorts.map(p => p.port).join(' → ') + ' → ' : ''}${order.destinationPort}`
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${order.orderNumber}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const PriceHistoryDialog = ({ agentCompany, priceHistory, priceChange }) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button 
        variant="link" 
        className={`flex items-center p-0 m-0 ${priceChange >= 0 ? 'text-red-500' : 'text-green-500'}`}
      >
        {priceChange >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        <span className="text-xs">{Math.abs(priceChange).toFixed(2)}%</span>
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>{agentCompany} - Price History</DialogTitle>
      </DialogHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {priceHistory.map((entry, index) => (
            <TableRow key={index}>
              <TableCell>{entry.date}</TableCell>
              <TableCell>${entry.price.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DialogContent>
  </Dialog>
);

const StarRating = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <React.Fragment key={index}>
          {index < fullStars ? (
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
          ) : index === fullStars && hasHalfStar ? (
            <StarHalf className="w-4 h-4 text-yellow-400 fill-current" />
          ) : (
            <Star className="w-4 h-4 text-gray-300" />
          )}
        </React.Fragment>
      ))}
      <span className="ml-1 text-sm text-foreground">{rating.toFixed(1)}</span>
    </div>
  );
};

const QuotationSection = ({ order, onSelectAgent }) => {
  const [sortBy, setSortBy] = useState('price');
  const [filterText, setFilterText] = useState('');
  const [expandedQuotation, setExpandedQuotation] = useState(null);

  const sortedAndFilteredQuotations = useMemo(() => {
    return order.quotations
      .filter(q => 
        q.agentCompany.toLowerCase().includes(filterText.toLowerCase()) ||
        q.price.toString().includes(filterText)
      )
      .sort((a, b) => {
        if (sortBy === 'price') return a.price - b.price;
        if (sortBy === 'time') return a.estimatedTime - b.estimatedTime;
        return 0;
      });
  }, [order.quotations, sortBy, filterText]);

  const handleSelectAgent = (quotation) => {
    onSelectAgent(quotation.agentId);
  };

  const renderTransitRoute = (quotation) => {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">{order.originPort}</span>
        {quotation.transhipmentPorts && quotation.transhipmentPorts.map((port, index) => (
          <React.Fragment key={index}>
            <span className="text-sm">→</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-sm font-medium">{port.port}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estimated Time: {port.estimatedTime}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </React.Fragment>
        ))}
        <span className="text-sm">→</span>
        <span className="text-sm font-medium">{order.destinationPort}</span>
      </div>
    );
  };

  const renderShipmentSpecificFields = (quotation) => {
    if (order.shipmentType === 'air') {
      return (
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm font-medium">Airline</p>
            <p>{quotation.airline}</p>
          </div>
          <div>
            <p className="text-sm font-medium">AWB</p>
            <p>{quotation.AWB}</p>
          </div>
          <div>
            <p className="text-sm font-medium">HAWB</p>
            <p>{quotation.HAWB}</p>
          </div>
        </div>
      );
    } else if (order.shipmentType === 'sea') {
      return (
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-sm font-medium">Carrier</p>
            <p>{quotation.carrier}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Vessel</p>
            <p>{quotation.vessel}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Net Freight</p>
            <p>${quotation.netFreight}</p>
          </div>
          <div>
            <p className="text-sm font-medium">DTHC</p>
            <p>${quotation.DTHC}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Free Time</p>
            <p>{quotation.freeTime}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Freight Quotations</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(sortedAndFilteredQuotations, order)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Input
              placeholder="Filter quotes..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-[200px]"
            />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="time">Est. Time</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Est. Time</TableHead>
              <TableHead>Route</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredQuotations.map((quotation, index) => {
              const priceHistory = generatePriceHistory(quotation.price, quotation.agentId);
              const previousPrice = priceHistory[priceHistory.length - 2].price;
              const priceChange = ((quotation.price - previousPrice) / previousPrice) * 100;
              const hasAmendment = quotation.amendments > 0;

              return (
                <React.Fragment key={index}>
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
                        {hasAmendment && (
                          <PriceHistoryDialog 
                            agentCompany={quotation.agentCompany} 
                            priceHistory={priceHistory}
                            priceChange={priceChange}
                          />
                        )}
                        {!hasAmendment && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{quotation.estimatedTime} days</TableCell>
                    <TableCell>{renderTransitRoute(quotation)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedQuotation(expandedQuotation === index ? null : index)}
                        >
                          {expandedQuotation === index ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        {order.status === 'pending' && (
                          <Button onClick={() => handleSelectAgent(quotation)} size="sm" variant="default">Select</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedQuotation === index && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="p-4 bg-muted rounded-md">
                          {renderShipmentSpecificFields(quotation)}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default QuotationSection;