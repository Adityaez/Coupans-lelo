"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/listing-constants";
import { formatOfferStatus, getStatusColor } from "@/lib/offer-constants";
import { ArrowRight, Clock } from "lucide-react";

interface OfferSummary {
  id: string;
  amount: number;
  status: string;
  updatedAt: string;
  listing: {
    id: string;
    slug: string;
    brand: string;
    category: string;
    askingPrice: number;
  };
  counterparty: {
    name: string | null;
  };
}

interface OfferListProps {
  offers: OfferSummary[];
  perspective: "buyer" | "seller";
  emptyMessage: string;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function OfferList({ offers, perspective, emptyMessage }: OfferListProps) {
  if (offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {offers.map((offer) => (
        <Link
          key={offer.id}
          href={`/listings/${offer.listing.id}-${offer.listing.slug}?offerId=${offer.id}`}
          className="block group"
        >
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-border hover:bg-muted/30 transition-all">
            {/* Brand initial */}
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-base font-bold text-muted-foreground shrink-0">
              {offer.listing.brand.charAt(0).toUpperCase()}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm truncate">
                  {offer.listing.brand}
                </span>
                <Badge
                  className={`text-[10px] font-semibold border-0 ${getStatusColor(offer.status)}`}
                >
                  {formatOfferStatus(offer.status)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span>
                  {perspective === "buyer" ? "Seller" : "Buyer"}:{" "}
                  {offer.counterparty.name || "User"}
                </span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {timeAgo(offer.updatedAt)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
              <p className="text-sm font-bold">{formatPrice(offer.amount)}</p>
              <p className="text-[10px] text-muted-foreground">
                of {formatPrice(offer.listing.askingPrice)}
              </p>
            </div>

            {/* Arrow */}
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  );
}
