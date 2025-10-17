'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const COLORS = {
  SEA: '#3b82f6',
  AIR: '#8b5cf6',
  FCL: '#10b981',
  LCL: '#f59e0b',
};

const ShipmentTypeChart = ({ data }) => {
  if (!data || !data.orders) return null;

  const shipmentData = Object.entries(data.orders.byShipmentType)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key === 'SEA' ? 'Sea Freight' : 'Air Freight',
      value,
      color: COLORS[key],
    }));

  const loadTypeData = Object.entries(data.orders.byLoadType)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: key,
      value,
      color: COLORS[key],
    }));

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Shipment Type Distribution</CardTitle>
          <CardDescription>
            Breakdown by sea and air freight
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shipmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={shipmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {shipmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No shipment data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Load Type Distribution</CardTitle>
          <CardDescription>
            Full container (FCL) vs less than container (LCL)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={loadTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {loadTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No load type data available
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ShipmentTypeChart;
