import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ListingFilters } from "@/components/listings/listing-filters";
import { ListingGrid } from "@/components/listings/listing-grid";
import type { ListingCardData } from "@/components/listings/listing-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  brand?: string;
  minDiscount?: string;
  expiringSoon?: string;
  sort?: string;
  page?: string;
}>;

export async function generateMetadata(props: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const parts = ["Browse Coupons & Gift Cards"];
  if (searchParams.category) parts.push(`in ${searchParams.category}`);
  if (searchParams.q) parts.push(`matching "${searchParams.q}"`);

  return {
    title: `${parts.join(" ")} | CouponSwap`,
    description:
      "Find the best deals on unused coupons and gift cards. Filter by brand, category, and discount to save big.",
  };
}

const PAGE_SIZE = 12;

export default async function ListingsPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q?.trim() || "";
  const category = searchParams.category || "";
  const minDiscount = parseInt(searchParams.minDiscount || "0", 10);
  const expiringSoon = searchParams.expiringSoon === "true";
  const sort = searchParams.sort || "newest";
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));

  // Build where clause
  const where: Prisma.ListingWhereInput = {
    status: "active",
    expiryDate: expiringSoon
      ? {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      : { gte: new Date() },
  };

  if (category) where.category = category;

  if (q) {
    where.OR = [
      { brand: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  // Build orderBy
  let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: "desc" };
  switch (sort) {
    case "price_low":
      orderBy = { askingPrice: "asc" };
      break;
    case "price_high":
      orderBy = { askingPrice: "desc" };
      break;
    case "expiry":
      orderBy = { expiryDate: "asc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [allListings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        seller: {
          select: { name: true, avatarUrl: true, ratingAvg: true },
        },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
  ]);

  // Apply discount filter + discount sort in memory (computed field)
  let listings = allListings.map((l) => ({
    id: l.id,
    brand: l.brand,
    slug: l.slug,
    category: l.category,
    faceValue: Number(l.faceValue),
    askingPrice: Number(l.askingPrice),
    expiryDate: l.expiryDate.toISOString(),
    couponType: l.couponType,
    imageUrl: l.imageUrl,
    status: l.status,
    sellerName: l.seller.name,
    sellerAvatar: l.seller.avatarUrl,
    sellerRating: l.seller.ratingAvg,
  })) satisfies ListingCardData[];

  if (minDiscount > 0) {
    listings = listings.filter((l) => {
      const disc = l.faceValue > 0
        ? ((l.faceValue - l.askingPrice) / l.faceValue) * 100
        : 0;
      return disc >= minDiscount;
    });
  }

  if (sort === "discount") {
    listings.sort((a, b) => {
      const dA = a.faceValue > 0 ? ((a.faceValue - a.askingPrice) / a.faceValue) * 100 : 0;
      const dB = b.faceValue > 0 ? ((b.faceValue - b.askingPrice) / b.faceValue) * 100 : 0;
      return dB - dA;
    });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Browse Coupons
            </h1>
            <p className="text-muted-foreground mt-1">
              Find deals on unused coupons and gift cards
            </p>
          </div>
          <Link href="/sell">
            <Button className="cursor-pointer gap-2">
              <Plus className="h-4 w-4" />
              Sell a Coupon
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Suspense fallback={null}>
          <ListingFilters />
        </Suspense>

        {/* Grid */}
        <ListingGrid
          listings={listings}
          total={minDiscount > 0 ? listings.length : total}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            {page > 1 && (
              <Link
                href={`/listings?${buildPageParams(searchParams, page - 1)}`}
              >
                <Button variant="outline" size="sm" className="cursor-pointer">
                  ← Previous
                </Button>
              </Link>
            )}

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Link
                    key={pageNum}
                    href={`/listings?${buildPageParams(searchParams, pageNum)}`}
                  >
                    <Button
                      variant={pageNum === page ? "default" : "ghost"}
                      size="sm"
                      className="w-9 h-9 cursor-pointer"
                    >
                      {pageNum}
                    </Button>
                  </Link>
                );
              })}
              {totalPages > 5 && (
                <span className="px-2 text-muted-foreground text-sm">
                  …{totalPages}
                </span>
              )}
            </div>

            {page < totalPages && (
              <Link
                href={`/listings?${buildPageParams(searchParams, page + 1)}`}
              >
                <Button variant="outline" size="sm" className="cursor-pointer">
                  Next →
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function buildPageParams(
  current: Awaited<SearchParams>,
  newPage: number
): string {
  const params = new URLSearchParams();
  if (current.q) params.set("q", current.q);
  if (current.category) params.set("category", current.category);
  if (current.minDiscount) params.set("minDiscount", current.minDiscount);
  if (current.expiringSoon) params.set("expiringSoon", current.expiringSoon);
  if (current.sort) params.set("sort", current.sort);
  if (newPage > 1) params.set("page", String(newPage));
  return params.toString();
}
