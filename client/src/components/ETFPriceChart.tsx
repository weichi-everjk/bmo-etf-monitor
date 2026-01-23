import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PriceSeriesPoint } from "../types";

interface ETFPriceChartProps {
  data: PriceSeriesPoint[];
}

export default function ETFPriceChart({ data }: ETFPriceChartProps) {
  if (data.length === 0) {
    return (
      <div className="mt-8 p-8 bg-white rounded-xl shadow-lg text-center text-gray-500">
        No price data available
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        ETF Price Over Time
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
            tickMargin={20}
          />

          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(v: number | undefined) =>
              v != null ? `$${v.toFixed(2)}` : ""
            }
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
