import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TopHoldingItem } from "../types";

interface TopHoldingsChartProps {
  data: TopHoldingItem[];
}

export default function TopHoldingsChart({ data }: TopHoldingsChartProps) {
  if (data.length === 0) {
    return (
      <div className="mt-8 p-8 bg-white rounded-xl shadow-lg text-center">
        <p className="text-gray-500">No holding data available</p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Top 5 Holdings by Size
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{
              value: "Holding Size ($)",
              angle: -90,
            }}
          />
          <Tooltip
            formatter={(value: number | undefined) =>
              value != null ? `$${value.toFixed(2)}` : ""
            }
            labelFormatter={(label) => `Constituent: ${label}`}
          />
          <Legend />
          <Bar
            dataKey="size"
            fill="#3b82f6"
            name="Holding Size"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
