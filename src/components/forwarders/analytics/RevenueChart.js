'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const RevenueChart = ({ data, timeRange }) => {
  if (!data || !data.trends || !data.trends.quotesByPeriod) return null;

  const chartData = data.trends.quotesByPeriod.map(period => ({
    period: formatPeriodLabel(period.period, timeRange),
    revenue: period.revenue,
    quotes: period.quotes,
    won: period.won,
    lost: period.lost,
  }));

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value}`;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
        <CardDescription>
          Actual revenue from won orders over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="period"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'revenue') return [formatCurrency(value), 'Revenue (Won Orders)'];
                return [value, name];
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Revenue (Won Orders)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

function formatPeriodLabel(period, timeRange) {
  if (timeRange === '7d') {
    // Format: MM/DD
    const date = new Date(period);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else if (timeRange === '30d' || timeRange === '90d') {
    // Format: Week of MM/DD
    const date = new Date(period);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else {
    // Format: MMM YYYY
    const [year, month] = period.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

export default RevenueChart;
