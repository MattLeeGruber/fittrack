"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { PoidsLog } from "@/lib/supabase";

interface WeightChartProps {
  data: PoidsLog[];
  objectif?: number | null;
}

interface TooltipPayload {
  value: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-lg px-3 py-2 text-sm">
        <p className="text-[#7A7A9A]">{label}</p>
        <p className="text-[#F0F0F5] font-semibold">{payload[0].value} kg</p>
      </div>
    );
  }
  return null;
}

export default function WeightChart({ data, objectif }: WeightChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[#7A7A9A] text-sm">
        Aucune donnée de poids
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const chartData = sorted.map((d) => ({
    date: format(parseISO(d.date), "dd/MM", { locale: fr }),
    poids: d.poids_kg,
    rawDate: d.date,
  }));

  const today = new Date().toISOString().slice(0, 10);
  const todayPoint = chartData.find((d) => d.rawDate === today);

  const vals = chartData.map((d) => d.poids);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const trend = vals.length > 1 ? vals[vals.length - 1] - vals[0] : 0;
  const lineColor = trend <= 0 ? "#00D4AA" : "#FF6B35";

  const yMin = Math.floor((Math.min(min, objectif ?? min) - 1));
  const yMax = Math.ceil((Math.max(max, objectif ?? max) + 1));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#7A7A9A" }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(chartData.length / 5)}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fontSize: 10, fill: "#7A7A9A" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="poids"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: lineColor }}
        />
        {todayPoint && (
          <ReferenceDot
            x={todayPoint.date}
            y={todayPoint.poids}
            r={5}
            fill="#F0F0F5"
            stroke={lineColor}
            strokeWidth={2}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
