'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Calendar } from 'lucide-react';
import PerformanceMetrics from './PerformanceMetrics';
import RevenueChart from './RevenueChart';
import OrderVolumeChart from './OrderVolumeChart';
import ShipmentTypeChart from './ShipmentTypeChart';
import QuoteWinRateChart from './QuoteWinRateChart';
import RouteAnalytics from './RouteAnalytics';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/forwarders/analytics?timeRange=${timeRange}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
  ];

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading analytics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your performance and business insights
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Metrics */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      ) : (
        <PerformanceMetrics data={data} />
      )}

      {/* Revenue Chart */}
      {isLoading ? (
        <Skeleton className="h-[450px] w-full" />
      ) : (
        <RevenueChart data={data} timeRange={timeRange} />
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[450px]" />
            <Skeleton className="h-[450px]" />
          </>
        ) : (
          <>
            <OrderVolumeChart data={data} timeRange={timeRange} />
            <QuoteWinRateChart data={data} timeRange={timeRange} />
          </>
        )}
      </div>

      {/* Distribution Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </>
        ) : (
          <ShipmentTypeChart data={data} />
        )}
      </div>

      {/* Routes Analytics */}
      {isLoading ? (
        <Skeleton className="h-[500px] w-full" />
      ) : (
        <RouteAnalytics data={data} />
      )}
    </div>
  );
};

export default AnalyticsDashboard;
