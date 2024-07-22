import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown } from 'lucide-react';

const PriceHistoryDialog = ({ agentCompany, priceHistory, priceChange }) => {
  const formatCurrency = (value) => `$${value.toFixed(2)}`;

  return (
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
      <DialogContent className="sm:max-w-[425px]">
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
                <TableCell>{formatCurrency(entry.price)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default PriceHistoryDialog;