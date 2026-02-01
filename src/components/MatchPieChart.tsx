import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { MatchResult, MatchCategory } from '../../lib/schemas';

// ============================================================================
// Props
// ============================================================================

interface MatchPieChartProps {
  matchResults: MatchResult[];
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_CONFIG: Record<MatchCategory, { color: string; label: string }> = {
  strong_match: { color: '#22c55e', label: 'Strong Matches' },
  possible_match: { color: '#eab308', label: 'Possible Matches' },
  future_potential: { color: '#3b82f6', label: 'Future Potential' },
  not_eligible: { color: '#6b7280', label: 'Not Eligible' },
};

// ============================================================================
// Component
// ============================================================================

export function MatchPieChart({ matchResults }: MatchPieChartProps) {
  if (matchResults.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No results to display</p>
      </div>
    );
  }

  // Calculate category counts
  const categoryCounts = matchResults.reduce(
    (acc, result) => {
      acc[result.category] = (acc[result.category] || 0) + 1;
      return acc;
    },
    {} as Record<MatchCategory, number>
  );

  // Create chart data (only include non-zero categories)
  const chartData = (Object.keys(CATEGORY_CONFIG) as MatchCategory[])
    .filter((category) => categoryCounts[category] > 0)
    .map((category) => ({
      name: CATEGORY_CONFIG[category].label,
      value: categoryCounts[category],
      color: CATEGORY_CONFIG[category].color,
    }));

  const totalTrials = matchResults.length;

  return (
    <div className="w-full max-w-md mx-auto">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value} trial${value !== 1 ? 's' : ''}`, name]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              padding: '0.5rem 0.75rem',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => (
              <span className="text-sm text-gray-700">
                {value} ({(entry.payload as { value: number }).value})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="text-center -mt-40 mb-24 pointer-events-none">
        <p className="text-3xl font-bold text-gray-900">{totalTrials}</p>
        <p className="text-sm text-gray-500">Trials Analyzed</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-500">{item.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
