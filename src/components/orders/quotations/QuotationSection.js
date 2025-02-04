import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, PackageSearch } from 'lucide-react';
import QuotationTable from './QuotationTable';
import { useQuotations } from '@/hooks/useQuotations';
import { exportToCSV } from '@/lib/csvExport';
import { sortOptions } from '@/config/shipmentConfig';

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">No Quotations Yet</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      Freight forwarders haven't submitted any quotes for this shipment yet. 
      Check back soon or contact support for assistance.
    </p>
  </div>
);

const QuotationSection = ({ order, quotes, onSelectAgent }) => {
  const {
    sortedAndFilteredQuotations,
    sortBy,
    setSortBy,
    filterText,
    setFilterText
  } = useQuotations(quotes);

  const hasQuotes = quotes && quotes.length > 0;

  return (  
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">
          Freight Quotations
          {hasQuotes && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({quotes.length} quote{quotes.length !== 1 ? 's' : ''})
            </span>
          )}
        </CardTitle>
        {hasQuotes && (
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
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {hasQuotes ? (
          <QuotationTable 
            quotations={sortedAndFilteredQuotations} 
            order={order} 
            onSelectAgent={onSelectAgent} 
          />
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
};

export default QuotationSection;