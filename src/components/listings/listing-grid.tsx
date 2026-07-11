import { ListingCard, type ListingCardData } from "./listing-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "lucide-react";

type ListingGridProps = {
  listings: ListingCardData[];
  total: number;
  isLoading?: boolean;
};

export function ListingGrid({ listings, total, isLoading }: ListingGridProps) {
  if (isLoading) {
    return <ListingGridSkeleton />;
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <Tag className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          No listings found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try adjusting your filters or search terms. New coupons are added regularly!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">{listings.length}</span>{" "}
        of{" "}
        <span className="font-semibold text-foreground">{total}</span>{" "}
        listing{total !== 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}

function ListingGridSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 overflow-hidden"
          >
            <Skeleton className="aspect-[16/10] w-full" />
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-20" />
              <div className="flex justify-between pt-3 border-t border-border/40">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
