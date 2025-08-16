import { Card, CardContent } from "@/components/ui/card"

export function ProductCardSkeleton() {
  return (
    <Card className="border-border">
      <div className="aspect-square bg-muted animate-pulse rounded-t-lg" />
      <CardContent className="p-4 space-y-3">
        <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-5 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}
