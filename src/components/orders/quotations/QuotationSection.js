import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from 'lucide-react';
import QuotationTable from './QuotationTable';
import { useQuotations } from '@/hooks/useQuotations';
import { exportToCSV } from '@/lib/csvExport';
import { sortOptions } from '@/config/shipmentConfig';

const QuotationSection = ({ order, onSelectAgent }) => {
  const {
    sortedAndFilteredQuotations,
    sortBy,
    setSortBy,
    filterText,
    setFilterText
  } = useQuotations(order.quotations);

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
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <QuotationTable 
          quotations={sortedAndFilteredQuotations} 
          order={order} 
          onSelectAgent={onSelectAgent} 
        />
      </CardContent>
    </Card>
  );
};

export default QuotationSection;