'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Building, Search, Star, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ExportersTable({ exporters }) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredExporters = useMemo(() => {
    if (!searchQuery.trim()) return exporters;

    const query = searchQuery.toLowerCase();
    return exporters.filter((exporter) => {
      return (
        exporter.name?.toLowerCase().includes(query) ||
        exporter.email?.toLowerCase().includes(query) ||
        exporter.phone?.toLowerCase().includes(query) ||
        exporter.address?.toLowerCase().includes(query)
      );
    });
  }, [exporters, searchQuery]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'BLACKLISTED':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Blacklisted
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleViewOrders = (exporterId) => {
    router.push(`/forwarders/dashboard?exporter=${exporterId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search exporters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredExporters.length} {filteredExporters.length === 1 ? 'exporter' : 'exporters'}
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exporter</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExporters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No exporters found matching &quot;{searchQuery}&quot;
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredExporters.map((exporter) => (
                <TableRow key={exporter.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {exporter.iconurl ? (
                        <Image
                          src={exporter.iconurl}
                          alt={exporter.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{exporter.name}</div>
                        {exporter.is_verified && (
                          <Badge variant="outline" className="text-xs mt-1">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {exporter.email && (
                        <div className="truncate max-w-[200px]">{exporter.email}</div>
                      )}
                      {exporter.phone && (
                        <div className="text-muted-foreground">{exporter.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {getStatusBadge(exporter.relationship?.status)}
                      {exporter.relationship?.blacklist_reason && (
                        <div className="text-xs text-red-600 max-w-[150px] truncate">
                          {exporter.relationship.blacklist_reason}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">
                        {exporter.average_rating ? exporter.average_rating.toFixed(1) : 'N/A'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({exporter.total_ratings || 0})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {exporter.total_orders || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrders(exporter.id)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Orders
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
