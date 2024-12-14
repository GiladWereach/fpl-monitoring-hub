import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string | number;
  status: "success" | "warning" | "error" | "info";
  icon: React.ReactNode;
  indicator?: React.ReactNode; // Added this line
}

export function StatusCard({ title, value, status, icon, indicator }: StatusCardProps) {
  return (
    <div className="glass-card rounded-lg p-6 transition-all duration-200 hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-2xl font-bold">{value}</h3>
          {indicator && <div className="mt-2">{indicator}</div>} {/* Added this line */}
        </div>
        <div
          className={cn("status-badge", {
            "status-badge-success": status === "success",
            "status-badge-warning": status === "warning",
            "status-badge-error": status === "error",
            "status-badge-info": status === "info",
          })}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}