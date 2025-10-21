'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const QuoteWinRateChart = ({ data, timeRange }) => {
  if (!data || !data.trends || !data.trends.quotesByPeriod) return null;

  const chartData = data.trends.quotesByPeriod.map(period => {
    const total = period.quotes;
    const winRate = total > 0 ? ((period.won / total) * 100).toFixed(1) : 0;
    const responseRate = data.overview.totalInvitations > 0
      ? ((total / data.overview.totalInvitations) * 100).toFixed(1)
      : 0;

    return {
      period: formatPeriodLabel(period.period, timeRange),
      winRate: parseFloat(winRate),
      quotes: total,
      won: period.won,
      lost: period.lost,
    };
  });

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Win Rate Trends</CardTitle>
        <CardDescription>
          Percentage of quotes won over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="period"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                return [value, name];
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="winRate"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Win Rate"
            />
          </LineChart>
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

export default QuoteWinRateChart;
