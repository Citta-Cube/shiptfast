import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Download, PackageSearch, FileText, ChevronDown } from 'lucide-react';
import QuotationTable from './QuotationTable';
import SelectedQuoteSection from './SelectedQuoteSection';
import { useQuotations } from '@/hooks/useQuotations';
import { exportToCSV, exportToPDF } from '@/lib/csvExport';
import { sortOptions } from '@/config/shipmentConfig';

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold mb-2">No Quotations Yet</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      Freight forwarders haven&apos;t submitted any quotes for this shipment yet. 
      Check back soon or contact support for assistance.
    </p>
  </div>
);

const QuotationSection = ({ order, quotes, onSelectAgent, quoteDocuments = [] }) => {
  const {
    sortedAndFilteredQuotations,
    sortBy,
    setSortBy,
    filterText,
    setFilterText
  } = useQuotations(quotes);

  const hasQuotes = quotes && quotes.length > 0;

  // Find the selected quote
  const selectedQuote = quotes?.find(quote => quote.id === order.selected_quote_id);

  // Filter out the selected quote from the list to avoid duplication
  const availableQuotes = quotes?.filter(quote => quote.id !== order.selected_quote_id) || [];

  // Apply sorting and filtering to available quotes (excluding selected)
  const {
    sortedAndFilteredQuotations: filteredAvailableQuotes,
    sortBy: availableSortBy,
    setSortBy: setAvailableSortBy,
    filterText: availableFilterText,
    setFilterText: setAvailableFilterText
  } = useQuotations(availableQuotes);

  return (
    <div className="col-span-2 space-y-6">
      {/* Selected Quote Section */}
      <SelectedQuoteSection
        order={order}
        selectedQuote={selectedQuote}
        quoteDocuments={quoteDocuments}
      />
      
      {/* Available Quotations Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">
            Available Quotations
            {availableQuotes.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({availableQuotes.length} quote{availableQuotes.length !== 1 ? 's' : ''})
              </span>
            )}
          </CardTitle>
          {availableQuotes.length > 0 && (
            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      // Include selected quote if it exists, plus all available quotes
                      const allQuotes = selectedQuote 
                        ? [selectedQuote, ...filteredAvailableQuotes]
                        : filteredAvailableQuotes;
                      exportToCSV(allQuotes, order);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      // Include selected quote if it exists, plus all available quotes
                      const allQuotes = selectedQuote 
                        ? [selectedQuote, ...filteredAvailableQuotes]
                        : filteredAvailableQuotes;
                      exportToPDF(allQuotes, order);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                placeholder="Filter quotes..."
                value={availableFilterText}
                onChange={(e) => setAvailableFilterText(e.target.value)}
                className="w-[200px]"
              />
              <Select value={availableSortBy} onValueChange={setAvailableSortBy}>
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
          {availableQuotes.length > 0 ? (
            <QuotationTable 
              quotations={filteredAvailableQuotes} 
              order={order} 
              onSelectAgent={onSelectAgent} 
            />
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationSection;