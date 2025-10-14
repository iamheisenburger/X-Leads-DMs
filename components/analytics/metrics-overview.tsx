"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}

export function MetricCard({ title, value, change, icon }: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0)
      return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    if (change < 0)
      return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendText = () => {
    if (change === undefined) return null;
    const sign = change > 0 ? "+" : "";
    return (
      <span
        className={`text-sm font-medium ${
          change > 0
            ? "text-green-600 dark:text-green-400"
            : change < 0
            ? "text-red-600 dark:text-red-400"
            : "text-muted-foreground"
        }`}
      >
        {sign}
        {change}%
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {getTrendIcon()}
            {getTrendText()}
            <span className="text-xs text-muted-foreground ml-1">vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricsOverviewProps {
  totalSent: number;
  replyRate: number;
  signupRate: number;
  avgScore: number;
  sentChange?: number;
  replyChange?: number;
  signupChange?: number;
}

export function MetricsOverview({
  totalSent,
  replyRate,
  signupRate,
  avgScore,
  sentChange,
  replyChange,
  signupChange,
}: MetricsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total DMs Sent"
        value={totalSent}
        change={sentChange}
        icon={<span className="text-2xl">📨</span>}
      />
      <MetricCard
        title="Reply Rate"
        value={`${replyRate}%`}
        change={replyChange}
        icon={<span className="text-2xl">💬</span>}
      />
      <MetricCard
        title="Signup Rate"
        value={`${signupRate}%`}
        change={signupChange}
        icon={<span className="text-2xl">✅</span>}
      />
      <MetricCard
        title="Avg Score"
        value={avgScore.toFixed(1)}
        icon={<span className="text-2xl">🎯</span>}
      />
    </div>
  );
}

