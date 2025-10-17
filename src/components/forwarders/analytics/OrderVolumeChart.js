'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const OrderVolumeChart = ({ data, timeRange }) => {
  if (!data || !data.trends || !data.trends.quotesByPeriod) return null;

  const chartData = data.trends.quotesByPeriod.map(period => ({
    period: formatPeriodLabel(period.period, timeRange),
    total: period.quotes,
    won: period.won,
    lost: period.lost,
    pending: period.quotes - period.won - period.lost,
  }));

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Quote Volume & Success Rate</CardTitle>
        <CardDescription>
          Number of quotes submitted and their outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="period"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="won" stackId="a" fill="#10b981" name="Won" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" radius={[0, 0, 0, 0]} />
            <Bar dataKey="lost" stackId="a" fill="#ef4444" name="Lost" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

function formatPeriodLabel(period, timeRange) {
  if (timeRange === '7d') {
    const date = new Date(period);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else if (timeRange === '30d' || timeRange === '90d') {
    const date = new Date(period);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else {
    const [year, month] = period.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

export default OrderVolumeChart;
