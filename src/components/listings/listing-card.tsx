import Link from "next/link";
import { Tag, Clock, Ticket, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  calcDiscount,
  formatPrice,
  daysUntilExpiry,
} from "@/lib/listing-constants";

export type ListingCardData = {
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
  sellerName?: string | null;
  sellerRating?: number;
};

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const discount = calcDiscount(listing.faceValue, listing.askingPrice);
  const daysLeft = daysUntilExpiry(listing.expiryDate);
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  return (
    <Link
      href={`/listings/${listing.id}-${listing.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5"
    >
      {/* Discount badge */}
      {discount > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-emerald-500 text-white border-0 font-bold text-xs px-2.5 py-1 shadow-md">
            {discount}% OFF
          </Badge>
        </div>
      )}

      {/* Image / Placeholder */}
      <div className="relative aspect-[16/10] bg-gradient-to-br from-muted/50 to-muted overflow-hidden">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={`${listing.brand} coupon`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Tag className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        {/* Coupon type badge */}
        <div className="absolute bottom-2 right-2">
          <Badge
            variant="secondary"
            className="backdrop-blur-md bg-background/80 text-[10px] font-semibold gap-1"
          >
            {listing.couponType === "code" ? (
              <Smartphone className="h-3 w-3" />
            ) : (
              <Ticket className="h-3 w-3" />
            )}
            {listing.couponType === "code" ? "Digital" : "Physical"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 gap-2">
        {/* Brand & Category */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {listing.brand}
          </h3>
          <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
            {listing.category}
          </Badge>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(listing.askingPrice)}
          </span>
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(listing.faceValue)}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
          {/* Expiry */}
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              isExpired
                ? "text-destructive"
                : isExpiringSoon
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
            }`}
          >
            <Clock className="h-3 w-3" />
            {isExpired
              ? "Expired"
              : isExpiringSoon
                ? `${daysLeft}d left`
                : `${daysLeft} days`}
          </div>

          {/* Seller */}
          {listing.sellerName && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              by {listing.sellerName}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
