import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import QuotationRow from './QuotationRow';
import { tableColumns } from '@/config/shipmentConfig';

const QuotationTable = ({ quotations, order, onSelectAgent }) => {
  console.log(quotations);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {tableColumns.map((column) => (
            <TableHead key={column.key} className={column.align === 'right' ? 'text-right' : ''}>
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotations.map((quotation) => (
          <QuotationRow 
            key={quotation.id} 
            quotation={quotation} 
            order={order} 
            onSelectAgent={onSelectAgent}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default QuotationTable;