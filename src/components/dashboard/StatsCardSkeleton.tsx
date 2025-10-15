import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="w-12 h-12 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-20 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}
