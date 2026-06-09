/**
 * TrendChart Component
 *
 * Line chart showing monthly emission trends over time.
 * Accessible with descriptive aria-label.
 */

import { memo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { EmissionSnapshot } from '../../types/carbon';

interface TrendChartProps {
  history: EmissionSnapshot[];
  className?: string;
}

interface ChartPoint {
  month: string;
  total: number;
  transport: number;
  electricity: number;
  food: number;
}

function formatMonth(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  } catch {
    return dateStr;
  }
}

export const TrendChart = memo(function TrendChart({
  history,
  className = '',
}: TrendChartProps) {
  if (history.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[250px] text-slate-400 dark:text-slate-500 ${className}`}>
        <p>No historical data yet. Your trends will appear here over time.</p>
      </div>
    );
  }

  const data: ChartPoint[] = history.map((snap) => ({
    month: formatMonth(snap.date),
    total: Math.round(snap.totalAnnualKgCO2),
    transport: Math.round(snap.transport),
    electricity: Math.round(snap.electricity),
    food: Math.round(snap.food),
  }));

  const ariaDescription = `Emission trend from ${data[0]?.month ?? 'N/A'} to ${
    data[data.length - 1]?.month ?? 'N/A'
  }. Latest total: ${data[data.length - 1]?.total?.toLocaleString() ?? '0'} kg CO₂/year.`;

  return (
    <div
      className={className}
      role="img"
      aria-label={ariaDescription}
    >
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.15)"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: '#94A3B8' }}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#94A3B8' }}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
            width={60}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as ChartPoint;
                return (
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-sm">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                      {data.month}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-slate-600 dark:text-slate-400">Total:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {data.total.toLocaleString()} kg CO₂/yr
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#10B981"
            strokeWidth={2.5}
            fill="url(#trendGradient)"
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6, fill: '#059669' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
