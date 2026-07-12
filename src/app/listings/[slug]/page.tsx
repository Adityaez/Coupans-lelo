import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import {
  calcDiscount,
  formatPrice,
  daysUntilExpiry,
} from "@/lib/listing-constants";
import { TERMINAL_STATUSES } from "@/lib/offer-constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MakeOfferDialog } from "@/components/offers/make-offer-dialog";
import { OfferThread } from "@/components/offers/offer-thread";
import {
  Tag,
  Clock,
  ArrowLeft,
  Smartphone,
  Ticket,
  Star,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ offerId?: string }>;

export async function generateMetadata(props: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const id = slug.split("-")[0];

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { brand: true, category: true, askingPrice: true, faceValue: true, description: true },
  });

  if (!listing) {
    return { title: "Listing Not Found | CouponSwap" };
  }

  const discount = calcDiscount(Number(listing.faceValue), Number(listing.askingPrice));

  return {
    title: `${listing.brand} Coupon — ${discount}% Off | CouponSwap`,
    description:
      listing.description ||
      `Save ${discount}% on ${listing.brand} (${listing.category}). Get this ${listing.brand} coupon for just ${formatPrice(Number(listing.askingPrice))} instead of ${formatPrice(Number(listing.faceValue))}.`,
    openGraph: {
      title: `${listing.brand} Coupon — ${discount}% Off`,
      description: `Save ${discount}% on ${listing.brand}. Only ${formatPrice(Number(listing.askingPrice))}!`,
    },
  };
}

export default async function ListingDetailPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await props.params;
  // Extract ID from the slug format: "{id}-{slug-text}"
  const id = slug.split("-")[0];

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          ratingAvg: true,
          ratingCount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  // Resolve searchParams if any
  const { offerId } = await props.searchParams;

  const user = await getServerUser();
  const isOwner = user?.id === listing.sellerId;

  let activeOfferIdToShow: string | null = null;
  let listingOffers: any[] = [];

  if (user) {
    if (isOwner) {
      listingOffers = await prisma.offer.findMany({
        where: { listingId: listing.id },
        include: {
          buyer: { select: { name: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
      });

      if (offerId) {
        const found = listingOffers.find((o) => o.id === offerId);
        if (found) {
          activeOfferIdToShow = found.id;
        }
      } else {
        // Auto-select if there is exactly one active offer
        const nonTerminal = listingOffers.filter(
          (o) => !TERMINAL_STATUSES.includes(o.status as any)
        );
        if (nonTerminal.length === 1) {
          activeOfferIdToShow = nonTerminal[0].id;
        } else if (listingOffers.length === 1) {
          activeOfferIdToShow = listingOffers[0].id;
        }
      }
    } else {
      // Buyer view: Fetch their own offer
      const offer = await prisma.offer.findUnique({
        where: {
          listingId_buyerId: {
            listingId: listing.id,
            buyerId: user.id,
          },
        },
        select: { id: true, status: true },
      });
      if (offer && !TERMINAL_STATUSES.includes(offer.status as (typeof TERMINAL_STATUSES)[number])) {
        activeOfferIdToShow = offer.id;
      }
    }
  }

  const hasExistingOffer = !isOwner && activeOfferIdToShow !== null;

  const faceValue = Number(listing.faceValue);
  const askingPrice = Number(listing.askingPrice);
  const discount = calcDiscount(faceValue, askingPrice);
  const daysLeft = daysUntilExpiry(listing.expiryDate);
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft <= 0;

  const sellerJoined = new Date(listing.seller.createdAt).toLocaleDateString(
    "en-IN",
    { year: "numeric", month: "short" }
  );

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 md:py-12">
      {/* Back link */}
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Browse
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in">
        {/* Left column — Image & Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Image */}
          <div className="relative aspect-[16/10] rounded-xl bg-gradient-to-br from-muted/50 to-muted overflow-hidden border border-border/50">
            {listing.imageUrl ? (
              <img
                src={listing.imageUrl}
                alt={`${listing.brand} coupon`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Tag className="h-16 w-16 text-muted-foreground/20" />
              </div>
            )}
            {discount > 0 && (
              <Badge className="absolute top-4 left-4 bg-emerald-500 text-white border-0 font-bold text-sm px-3 py-1.5 shadow-lg">
                {discount}% OFF
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="absolute bottom-4 right-4 backdrop-blur-md bg-background/80 gap-1.5 text-xs font-semibold"
            >
              {listing.couponType === "code" ? (
                <Smartphone className="h-3.5 w-3.5" />
              ) : (
                <Ticket className="h-3.5 w-3.5" />
              )}
              {listing.couponType === "code" ? "Digital Code" : "Physical Coupon"}
            </Badge>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}

          {/* Listing Details */}
          <div className="rounded-xl border border-border/50 p-5 space-y-4">
            <h2 className="text-lg font-semibold">Listing Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-0.5">
                  Category
                </span>
                <span className="font-medium">{listing.category}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">
                  Coupon Type
                </span>
                <span className="font-medium capitalize">
                  {listing.couponType}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">
                  Listed On
                </span>
                <span className="font-medium">
                  {new Date(listing.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">
                  Status
                </span>
                <Badge
                  variant={
                    listing.status === "active"
                      ? "default"
                      : listing.status === "sold"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-xs capitalize"
                >
                  {listing.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — Pricing & Actions */}
        <div className="lg:col-span-2 space-y-5">
          {/* Price card */}
          <div className="sticky top-20 space-y-5">
            <div className="rounded-xl border border-border/50 bg-card p-6 space-y-5 shadow-sm">
              {/* Brand & Category */}
              <div>
                <Badge variant="outline" className="text-xs mb-2">
                  {listing.category}
                </Badge>
                <h1 className="text-2xl font-bold tracking-tight">
                  {listing.brand}
                </h1>
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">
                    Face Value
                  </span>
                  <span className="text-base text-muted-foreground line-through">
                    {formatPrice(faceValue)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">Asking Price</span>
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(askingPrice)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      You save {formatPrice(faceValue - askingPrice)} ({discount}
                      %)
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Expiry */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Expires</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 text-sm font-medium ${
                    isExpired
                      ? "text-destructive"
                      : isExpiringSoon
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-foreground"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {isExpired
                    ? "Expired"
                    : isExpiringSoon
                      ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left!`
                      : `${daysLeft} days left`}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              {listing.status === "active" && !isExpired && (
                <div className="space-y-3">
                  {isOwner ? (
                    <Link href={`/sell/edit/${listing.id}`} className="block">
                      <Button
                        variant="outline"
                        className="w-full h-12 text-base font-semibold cursor-pointer"
                      >
                        Edit Listing
                      </Button>
                    </Link>
                  ) : user ? (
                    <MakeOfferDialog
                      listingId={listing.id}
                      askingPrice={askingPrice}
                      faceValue={faceValue}
                      brand={listing.brand}
                      hasExistingOffer={hasExistingOffer}
                    />
                  ) : (
                    <Link href={`/login?next=/listings/${listing.id}-${listing.slug}`} className="block">
                      <Button className="w-full h-12 text-base font-semibold cursor-pointer">
                        Login to Make an Offer
                      </Button>
                    </Link>
                  )}
                  <p className="text-xs text-center text-muted-foreground">
                    <ShieldCheck className="inline h-3 w-3 mr-1" />
                    Protected by CouponSwap Escrow
                  </p>
                </div>
              )}

              {listing.status === "negotiating" && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-center">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    An offer has been accepted — awaiting payment
                  </span>
                </div>
              )}

              {listing.status === "sold" && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-center">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    This coupon has been sold
                  </span>
                </div>
              )}

              {isExpired && listing.status === "active" && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-center">
                  <span className="text-sm font-medium text-destructive">
                    This coupon has expired
                  </span>
                </div>
              )}
            </div>

            {/* Seller card */}
            <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Seller
              </h3>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-base font-bold text-muted-foreground">
                  {listing.seller.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {listing.seller.name || "Anonymous Seller"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-amber-500" />
                      {listing.seller.ratingAvg.toFixed(1)}
                    </span>
                    <span>·</span>
                    <span>
                      {listing.seller.ratingCount} review
                      {listing.seller.ratingCount !== 1 ? "s" : ""}
                    </span>
                    <span>·</span>
                    <span>Joined {sellerJoined}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* If seller is viewing their own listing and there are multiple offers, and none is selected, show list of offers */}
            {isOwner && listingOffers.length > 0 && !activeOfferIdToShow && (
              <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-base">Offers Received ({listingOffers.length})</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select an offer below to view the negotiation history and respond.
                  </p>
                </div>
                <div className="space-y-2">
                  {listingOffers.map((o) => (
                    <Link
                      key={o.id}
                      href={`/listings/${listing.id}-${listing.slug}?offerId=${o.id}`}
                      className="block group"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="text-sm font-semibold">
                            From {o.buyer.name || o.buyer.email || "Buyer"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Status: <span className="font-medium capitalize">{o.status}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatPrice(Number(o.amount))}</p>
                          <p className="text-[10px] text-muted-foreground">
                            updated {new Date(o.updatedAt).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Offer Thread — shown when buyer/seller has an active or selected offer */}
            {activeOfferIdToShow && user && (
              <div className="space-y-3">
                {isOwner && listingOffers.length > 1 && (
                  <Link
                    href={`/listings/${listing.id}-${listing.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium mb-1"
                  >
                    ← Back to all offers ({listingOffers.length})
                  </Link>
                )}
                <OfferThread
                  offerId={activeOfferIdToShow}
                  currentUserId={user.id}
                  askingPrice={askingPrice}
                  brand={listing.brand}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
