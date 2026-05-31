import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: "green" | "orange" | "red" | "default";
  className?: string;
}

const colorMap = {
  green: "text-[#00D4AA]",
  orange: "text-[#FF6B35]",
  red: "text-[#FF3B5C]",
  default: "text-[#F0F0F5]",
};

export default function StatCard({ icon, label, value, sub, color = "default", className }: StatCardProps) {
  return (
    <div className={cn("bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4", className)}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-[#7A7A9A] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={cn("text-2xl font-semibold", colorMap[color])}>{value}</div>
      {sub && <div className="text-xs text-[#7A7A9A] mt-1">{sub}</div>}
    </div>
  );
}
