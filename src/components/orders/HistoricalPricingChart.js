import React from 'react';
import { TrendingUp, TrendingDown, Ship } from 'lucide-react';
import { CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
    price: {
      label: "Price",
      color: "hsl(var(--chart-1))",
    },
}

const HistoricalPricingChart = ({ historicalData, currentBestQuote, startPort, endPort, isLoading }) => {
  const formatCurrency = (value) => `$${value.toFixed(2)}`;

  const chartData = historicalData?.map(item => ({
    ...item,
    price: parseFloat(item.price),
  })) || [];

  const latestHistoricalPrice = chartData[chartData.length - 1]?.price;
  const priceDifference = currentBestQuote ? (currentBestQuote - latestHistoricalPrice) : 0;
  const percentageDifference = latestHistoricalPrice ? ((priceDifference / latestHistoricalPrice) * 100).toFixed(2) : 0;

  const TrendIcon = priceDifference >= 0 ? TrendingUp : TrendingDown;
  const trendColor = priceDifference >= 0 ? "text-red-500" : "text-green-500";

  if (isLoading) {
    return (
      <Card className="w-full col-span-2">
        <CardHeader>
          <CardTitle>Historical Pricing</CardTitle>
          <CardDescription>Loading historical data...</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <Skeleton className="w-full h-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="w-full h-6" />
        </CardFooter>
      </Card>
    );
  }

  if (!historicalData || historicalData.length === 0) {
    return (
      <Card className="w-full col-span-2">
        <CardHeader>
          <CardTitle>Historical Pricing</CardTitle>
          <CardDescription>No historical data available</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No pricing data available for this route yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Historical Pricing</CardTitle>
            <CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://flagcdn.com/w20/${startPort.countryCode.toLowerCase()}.png`} />
                  <AvatarFallback>{startPort.countryCode}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{startPort.name}</span>
                <span className="text-sm">→</span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`https://flagcdn.com/w20/${endPort.countryCode.toLowerCase()}.png`} />
                  <AvatarFallback>{endPort.countryCode}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{endPort.name}</span>
              </div>
            </CardDescription>
          </div>
          {currentBestQuote && (
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(currentBestQuote)}</p>
              <p className="text-sm text-muted-foreground">Current Best Quote</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ChartContainer config={chartConfig}>
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 10,
                }}
              >
                <CartesianGrid vertical={true} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={true}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(5)} // Show only month part (MM)
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Line
                  dataKey="price"
                  type="monotone"
                  stroke="#1c24e5"
                  strokeWidth={2}
                  dot={{ fill: "#1c24e5", }}
                  activeDot={{ r: 6, }}
                >
                  <LabelList
                    dataKey="price"
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                    formatter={formatCurrency}
                  />
                </Line>
              </LineChart>
            </ChartContainer>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending <span className={trendColor}>{priceDifference >= 0 ? 'up' : 'down'} by {Math.abs(percentageDifference)}%</span> this month <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Showing historical pricing for the last 6 months
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default HistoricalPricingChart;