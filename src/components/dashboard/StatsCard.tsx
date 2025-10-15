import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { StatsCardProps } from "@/types";

export function StatsCard({ icon, value, label, variant = "default" }: StatsCardProps) {
  return (
    <Card
      className="relative overflow-hidden transition-all hover:shadow-md"
      role="status"
      aria-label={`${label}: ${value}`}
    >
      <CardHeader className="pb-2">
        <div
          className={`inline-flex p-3 rounded-full transition-colors ${
            variant === "highlight" ? "bg-primary/20" : "bg-primary/10"
          }`}
        >
          <div className="w-6 h-6 text-primary">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold mb-1 tabular-nums">{value}</div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
