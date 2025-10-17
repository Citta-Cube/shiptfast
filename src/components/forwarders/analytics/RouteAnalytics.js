'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Ship, TrendingUp } from 'lucide-react';

const RouteAnalytics = ({ data }) => {
  if (!data || !data.routes || data.routes.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Top Routes</CardTitle>
          <CardDescription>Most frequently quoted shipping routes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Ship className="h-12 w-12 mb-4 opacity-50" />
            <p>No route data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Top Routes</CardTitle>
        <CardDescription>
          Most frequently quoted shipping routes and their performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead className="text-right">Quotes</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead className="text-right">Avg Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.routes.map((route, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Ship className="h-4 w-4 text-blue-600" />
                    <span>
                      {route.origin.name} → {route.destination.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{route.origin.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {route.origin.country_code}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{route.destination.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {route.destination.country_code}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {route.count}
                </TableCell>
                <TableCell className="text-right">
                  ${route.totalValue.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  ${(route.totalValue / route.count).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RouteAnalytics;
