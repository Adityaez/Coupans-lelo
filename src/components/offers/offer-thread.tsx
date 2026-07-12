"use client";

import { useRealtimeOffer, type OfferEventData } from "@/hooks/use-realtime-offers";
import { formatPrice } from "@/lib/listing-constants";
import {
  formatOfferStatus,
  formatEventType,
  getStatusColor,
} from "@/lib/offer-constants";
import { OfferActionsBar } from "./offer-actions-bar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUp,
  ArrowLeftRight,
  Check,
  X,
  Clock,
  LogOut,
  User as UserIcon,
} from "lucide-react";

interface OfferThreadProps {
  offerId: string;
  currentUserId: string;
  askingPrice: number;
  brand: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  offer: <ArrowUp className="h-3.5 w-3.5" />,
  counter: <ArrowLeftRight className="h-3.5 w-3.5" />,
  accept: <Check className="h-3.5 w-3.5" />,
  reject: <X className="h-3.5 w-3.5" />,
  expire: <Clock className="h-3.5 w-3.5" />,
  withdraw: <LogOut className="h-3.5 w-3.5" />,
};

const EVENT_COLORS: Record<string, string> = {
  offer: "bg-blue-500",
  counter: "bg-amber-500",
  accept: "bg-emerald-500",
  reject: "bg-red-500",
  expire: "bg-zinc-400",
  withdraw: "bg-zinc-400",
};

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

function EventCard({ event, isCurrentUser }: { event: OfferEventData; isCurrentUser: boolean }) {
  return (
    <div className="flex gap-3 group">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center justify-center h-7 w-7 rounded-full text-white shrink-0 ${EVENT_COLORS[event.type] || "bg-zinc-400"}`}
        >
          {EVENT_ICONS[event.type] || <UserIcon className="h-3.5 w-3.5" />}
        </div>
        <div className="flex-1 w-px bg-border/50 mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold">
            {isCurrentUser ? "You" : event.actorName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatEventType(event.type)}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {timeAgo(event.createdAt)}
          </span>
        </div>
        {event.amount !== null && (
          <p className="text-lg font-bold mt-0.5">
            {formatPrice(event.amount)}
          </p>
        )}
        {event.message && (
          <p className="text-sm text-muted-foreground mt-1 bg-muted/50 rounded-lg px-3 py-2 italic">
            &ldquo;{event.message}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

export function OfferThread({
  offerId,
  currentUserId,
  askingPrice,
  brand,
}: OfferThreadProps) {
  const { offer, events, loading, error } = useRealtimeOffer(offerId);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error || !offer) {
    return null;
  }

  const isBuyer = currentUserId === offer.buyerId;
  const isSeller = currentUserId === offer.sellerId;

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
        <div>
          <h3 className="font-semibold text-sm">Negotiation Thread</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Current offer: {formatPrice(Number(offer.amount))}
          </p>
        </div>
        <Badge className={`text-xs font-semibold border-0 ${getStatusColor(offer.status)}`}>
          {formatOfferStatus(offer.status)}
        </Badge>
      </div>

      {/* Events timeline */}
      <div className="px-5 pt-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isCurrentUser={event.actorId === currentUserId}
          />
        ))}
      </div>

      {/* Actions */}
      {(isBuyer || isSeller) && (
        <>
          <Separator />
          <div className="px-5 py-3">
            <OfferActionsBar
              offerId={offer.id}
              offerStatus={offer.status}
              currentAmount={Number(offer.amount)}
              askingPrice={askingPrice}
              brand={brand}
              isBuyer={isBuyer}
              isSeller={isSeller}
            />
          </div>
        </>
      )}
    </div>
  );
}
