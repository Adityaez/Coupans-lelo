"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tag,
  Clock,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Loader2,
  ExternalLink,
  Smartphone,
  Ticket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  calcDiscount,
  formatPrice,
  daysUntilExpiry,
} from "@/lib/listing-constants";
import {
  deleteListing,
  markListingSold,
  reactivateListing,
} from "@/app/actions/listing-actions";

export type MyListingData = {
  id: string;
  brand: string;
  slug: string;
  category: string;
  faceValue: number;
  askingPrice: number;
  expiryDate: string;
  couponType: string;
  imageUrl: string | null;
  status: string;
  createdAt: string;
};

export function MyListingCard({ listing }: { listing: MyListingData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [soldOpen, setSoldOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discount = calcDiscount(listing.faceValue, listing.askingPrice);
  const daysLeft = daysUntilExpiry(listing.expiryDate);
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  const statusColor: Record<string, string> = {
    active:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    sold: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
    removed:
      "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteListing(listing.id);
      if (!result.success) {
        setError(result.error || "Failed to delete.");
      } else {
        setDeleteOpen(false);
        router.refresh();
      }
    });
  };

  const handleMarkSold = () => {
    setError(null);
    startTransition(async () => {
      const result = await markListingSold(listing.id);
      if (!result.success) {
        setError(result.error || "Failed to mark as sold.");
      } else {
        setSoldOpen(false);
        router.refresh();
      }
    });
  };

  const handleReactivate = () => {
    setError(null);
    startTransition(async () => {
      const result = await reactivateListing(listing.id);
      if (!result.success) {
        setError(result.error || "Failed to reactivate.");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-border transition-colors">
      {/* Image / Placeholder */}
      <div className="relative w-full sm:w-28 h-24 sm:h-28 rounded-lg bg-muted/50 overflow-hidden shrink-0">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.brand}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Tag className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}
        {discount > 0 && (
          <Badge className="absolute top-1.5 left-1.5 bg-emerald-500 text-white border-0 text-[10px] px-1.5 py-0.5">
            {discount}% OFF
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{listing.brand}</h3>
              <Badge
                variant="outline"
                className={`text-[10px] border ${statusColor[listing.status] || ""}`}
              >
                {listing.status}
              </Badge>
              <Badge variant="outline" className="text-[10px] gap-1">
                {listing.couponType === "code" ? (
                  <Smartphone className="h-2.5 w-2.5" />
                ) : (
                  <Ticket className="h-2.5 w-2.5" />
                )}
                {listing.couponType}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {listing.category}
            </p>
          </div>

          {/* View link */}
          <Link
            href={`/listings/${listing.id}-${listing.slug}`}
            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
            title="View listing"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {/* Price & Expiry */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold">{formatPrice(listing.askingPrice)}</span>
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(listing.faceValue)}
            </span>
          </div>
          <div
            className={`flex items-center gap-1 text-xs ${
              isExpired
                ? "text-destructive"
                : isExpiringSoon
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
            }`}
          >
            <Clock className="h-3 w-3" />
            {isExpired ? "Expired" : `${daysLeft}d left`}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          {listing.status === "active" && (
            <>
              <Link href={`/sell/edit/${listing.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 cursor-pointer"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              </Link>

              {/* Mark Sold Dialog */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 cursor-pointer text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/30"
                onClick={() => setSoldOpen(true)}
              >
                <CheckCircle2 className="h-3 w-3" />
                Mark Sold
              </Button>
              <Dialog open={soldOpen} onOpenChange={setSoldOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mark as Sold?</DialogTitle>
                    <DialogDescription>
                      This will remove the listing from the browse page. You can
                      reactivate it later if needed.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setSoldOpen(false)}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleMarkSold}
                      disabled={isPending}
                      className="cursor-pointer"
                    >
                      {isPending && (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      )}
                      Confirm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Dialog */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Listing?</DialogTitle>
                    <DialogDescription>
                      This will remove &ldquo;{listing.brand}&rdquo; from the
                      marketplace. This action can be undone by reactivating.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteOpen(false)}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isPending}
                      className="cursor-pointer"
                    >
                      {isPending && (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      )}
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}

          {(listing.status === "sold" || listing.status === "removed") && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 cursor-pointer"
              onClick={handleReactivate}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Reactivate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
