import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const q = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const minDiscount = parseInt(searchParams.get("minDiscount") || "0", 10);
  const expiringSoon = searchParams.get("expiringSoon") === "true";
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  try {
    // Build Prisma where clause
    const where: Prisma.ListingWhereInput = {
      status: "active",
    };

    if (category) {
      where.category = category;
    }

    if (brand) {
      where.brand = {
        contains: brand,
        mode: "insensitive",
      };
    }

    if (expiringSoon) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      where.expiryDate = {
        gte: new Date(),
        lte: sevenDaysFromNow,
      };
    } else {
      // Only show non-expired listings
      where.expiryDate = {
        gte: new Date(),
      };
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
      // "discount" and "newest" are handled below or default
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    // If full-text search query is present, use raw SQL for ts_rank
    if (q) {
      const searchTerms = q
        .split(/\s+/)
        .filter(Boolean)
        .map((t) => t.replace(/[^\w]/g, ""))
        .filter(Boolean);

      if (searchTerms.length > 0) {
        const tsQuery = searchTerms.join(" & ");

        // Count total matching
        const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*)::bigint as count FROM "Listing"
          WHERE status = 'active'
          AND "expiryDate" >= NOW()
          AND (
            to_tsvector('english', coalesce(brand, '') || ' ' || coalesce(category, '') || ' ' || coalesce(description, ''))
            @@ to_tsquery('english', ${tsQuery})
            OR brand ILIKE ${'%' + q + '%'}
            OR category ILIKE ${'%' + q + '%'}
          )
          ${category ? Prisma.sql`AND category = ${category}` : Prisma.empty}
        `;

        const total = Number(countResult[0]?.count || 0);

        const listings = await prisma.$queryRaw<Array<Record<string, unknown>>>`
          SELECT l.*, u.name as "sellerName", u."avatarUrl" as "sellerAvatar", u."ratingAvg" as "sellerRating",
            ts_rank(
              to_tsvector('english', coalesce(l.brand, '') || ' ' || coalesce(l.category, '') || ' ' || coalesce(l.description, '')),
              to_tsquery('english', ${tsQuery})
            ) as rank
          FROM "Listing" l
          LEFT JOIN "User" u ON l."sellerId" = u.id
          WHERE l.status = 'active'
          AND l."expiryDate" >= NOW()
          AND (
            to_tsvector('english', coalesce(l.brand, '') || ' ' || coalesce(l.category, '') || ' ' || coalesce(l.description, ''))
            @@ to_tsquery('english', ${tsQuery})
            OR l.brand ILIKE ${'%' + q + '%'}
            OR l.category ILIKE ${'%' + q + '%'}
          )
          ${category ? Prisma.sql`AND l.category = ${category}` : Prisma.empty}
          ORDER BY rank DESC, l."createdAt" DESC
          LIMIT ${PAGE_SIZE}
          OFFSET ${(page - 1) * PAGE_SIZE}
        `;

        return NextResponse.json({
          listings: serializeListings(listings),
          total,
          page,
          pageSize: PAGE_SIZE,
          totalPages: Math.ceil(total / PAGE_SIZE),
        });
      }
    }

    // Standard Prisma query (non-FTS)
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: {
            select: {
              name: true,
              avatarUrl: true,
              ratingAvg: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.listing.count({ where }),
    ]);

    // If sorting by discount, sort in memory (discount is a computed field)
    let sortedListings = listings;
    if (sort === "discount") {
      sortedListings = [...listings].sort((a, b) => {
        const discountA =
          Number(a.faceValue) > 0
            ? ((Number(a.faceValue) - Number(a.askingPrice)) / Number(a.faceValue)) * 100
            : 0;
        const discountB =
          Number(b.faceValue) > 0
            ? ((Number(b.faceValue) - Number(b.askingPrice)) / Number(b.faceValue)) * 100
            : 0;
        return discountB - discountA;
      });
    }

    // Filter by minimum discount if specified
    let filteredListings = sortedListings;
    if (minDiscount > 0) {
      filteredListings = sortedListings.filter((l) => {
        const discount =
          Number(l.faceValue) > 0
            ? ((Number(l.faceValue) - Number(l.askingPrice)) / Number(l.faceValue)) * 100
            : 0;
        return discount >= minDiscount;
      });
    }

    const serialized = filteredListings.map((l) => ({
      id: l.id,
      sellerId: l.sellerId,
      brand: l.brand,
      slug: l.slug,
      category: l.category,
      faceValue: Number(l.faceValue),
      askingPrice: Number(l.askingPrice),
      expiryDate: l.expiryDate.toISOString(),
      couponType: l.couponType,
      imageUrl: l.imageUrl,
      status: l.status,
      description: l.description,
      createdAt: l.createdAt.toISOString(),
      sellerName: l.seller.name,
      sellerAvatar: l.seller.avatarUrl,
      sellerRating: l.seller.ratingAvg,
    }));

    return NextResponse.json({
      listings: serialized,
      total: minDiscount > 0 ? filteredListings.length : total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil((minDiscount > 0 ? filteredListings.length : total) / PAGE_SIZE),
    });
  } catch (error) {
    console.error("Listings API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

// Serialize raw SQL results to match the standard format
function serializeListings(listings: Array<Record<string, unknown>>) {
  return listings.map((l) => ({
    id: l.id,
    sellerId: l.sellerId,
    brand: l.brand,
    slug: l.slug,
    category: l.category,
    faceValue: Number(l.faceValue),
    askingPrice: Number(l.askingPrice),
    expiryDate: l.expiryDate instanceof Date ? l.expiryDate.toISOString() : l.expiryDate,
    couponType: l.couponType,
    imageUrl: l.imageUrl,
    status: l.status,
    description: l.description,
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
    sellerName: l.sellerName,
    sellerAvatar: l.sellerAvatar,
    sellerRating: l.sellerRating != null ? Number(l.sellerRating) : 0,
  }));
}
