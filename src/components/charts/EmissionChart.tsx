/**
 * EmissionChart Component
 *
 * Donut chart showing emission breakdown by category.
 * Accessible with role="img" and descriptive aria-label.
 */

import { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CarbonFootprint } from '../../types/carbon';

interface EmissionChartProps {
  footprint: CarbonFootprint;
  className?: string;
}

const CATEGORY_COLORS = {
  transport: '#10B981',
  electricity: '#3B82F6',
  food: '#F59E0B',
};

const CATEGORY_LABELS = {
  transport: 'Transport',
  electricity: 'Electricity',
  food: 'Food',
};

interface ChartData {
  name: string;
  value: number;
  color: string;
  percent: number;
}

export const EmissionChart = memo(function EmissionChart({
  footprint,
  className = '',
}: EmissionChartProps) {
  const data: ChartData[] = [
    {
      name: CATEGORY_LABELS.transport,
      value: Math.round(footprint.transport.annualKgCO2),
      color: CATEGORY_COLORS.transport,
      percent: footprint.percentages.transport,
    },
    {
      name: CATEGORY_LABELS.electricity,
      value: Math.round(footprint.electricity.annualKgCO2),
      color: CATEGORY_COLORS.electricity,
      percent: footprint.percentages.electricity,
    },
    {
      name: CATEGORY_LABELS.food,
      value: Math.round(footprint.food.annualKgCO2),
      color: CATEGORY_COLORS.food,
      percent: footprint.percentages.food,
    },
  ];

  const ariaDescription = data
    .map((d) => `${d.name}: ${d.value.toLocaleString()} kg CO₂/year (${d.percent}%)`)
    .join(', ');

  return (
    <div
      className={`relative ${className}`}
      role="img"
      aria-label={`Carbon emission breakdown: ${ariaDescription}`}
    >
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
            animationDuration={800}
            animationBegin={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => [`${Number(value).toLocaleString()} kg CO₂/yr`, '']}
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderColor: 'rgba(51, 65, 85, 0.5)',
              borderRadius: '12px',
              color: '#e2e8f0',
              fontSize: '13px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {Math.round(footprint.totalAnnualKgCO2).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">kg CO₂/year</div>
        </div>
      </div>
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-2" aria-hidden="true">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {entry.name} ({entry.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
