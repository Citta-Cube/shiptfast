'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  DollarSign,
  Award,
  Target,
  Clock,
  Send,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const PerformanceMetrics = ({ data }) => {
  if (!data) return null;

  const { overview, revenue, performance } = data;

  const metrics = [
    {
      title: 'Total Invitations',
      value: overview.totalInvitations,
      icon: Send,
      description: 'Quote requests received',
      color: 'text-blue-600',
    },
    {
      title: 'Quotes Submitted',
      value: overview.quotesSubmitted,
      icon: Target,
      description: `${overview.responseRate}% response rate`,
      color: 'text-purple-600',
    },
    {
      title: 'Quotes Won',
      value: overview.quotesWon,
      icon: CheckCircle2,
      description: `${overview.winRate}% win rate`,
      color: 'text-green-600',
    },
    {
      title: 'Quotes Lost',
      value: overview.quotesLost,
      icon: XCircle,
      description: 'Not selected',
      color: 'text-red-600',
    },
    {
      title: 'Total Revenue',
      value: `$${(revenue.wonQuoteValue / 1000).toFixed(1)}K`,
      icon: TrendingUp,
      description: 'From won orders',
      color: 'text-emerald-600',
    },
    {
      title: 'Potential Value',
      value: `$${(revenue.totalQuoteValue / 1000).toFixed(1)}K`,
      icon: DollarSign,
      description: 'All quotes submitted',
      color: 'text-gray-600',
    },
    {
      title: 'Average Quote Value',
      value: `$${Number(revenue.averageQuoteValue).toLocaleString()}`,
      icon: DollarSign,
      description: 'Per quote submitted',
      color: 'text-cyan-600',
    },
    {
      title: 'Avg Response Time',
      value: `${performance.averageResponseTime}h`,
      icon: Clock,
      description: 'Time to submit quote',
      color: 'text-orange-600',
    },
    {
      title: 'Company Rating',
      value: `${overview.averageRating.toFixed(1)}/5`,
      icon: Award,
      description: `Based on ${overview.totalRatings} ratings`,
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PerformanceMetrics;
