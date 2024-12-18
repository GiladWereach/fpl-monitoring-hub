import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  indicator?: {
    color: string;
    show?: boolean;
  };
}

export function MetricsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  indicator
}: MetricsCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {indicator ? (
          <div className={`h-2 w-2 rounded-full ${indicator.color}`} />
        ) : (
          <Icon className={`h-4 w-4 ${iconColor}`} />
        )}
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">
        {subtitle}
      </p>
    </Card>
  );
}