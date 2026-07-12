import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/services/notification-service";
import { formatPrice } from "@/lib/listing-constants";

/**
 * Cron endpoint to expire stale offers.
 * Protected by CRON_SECRET header — call from Vercel Cron or manually.
 * POST /api/cron/expire-offers
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  // In development, allow without secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const expiredOffers = await prisma.offer.findMany({
      where: {
        status: { in: ["pending", "countered"] },
        expiresAt: { lt: now },
      },
      include: {
        listing: { select: { id: true, slug: true, brand: true, sellerId: true } },
        buyer: { select: { id: true, name: true } },
      },
    });

    let count = 0;

    for (const offer of expiredOffers) {
      await prisma.$transaction(async (tx) => {
        await tx.offer.update({
          where: { id: offer.id },
          data: { status: "expired" },
        });

        await tx.offerEvent.create({
          data: {
            offerId: offer.id,
            type: "expire",
            actorId: offer.buyerId, // system action, attributed to buyer
            message: "Offer expired after 24 hours without response.",
          },
        });
      });

      // Notify both parties
      await notifyUser({
        userId: offer.buyerId,
        type: "offer_expired",
        title: "Offer Expired",
        body: `Your offer of ${formatPrice(Number(offer.amount))} for the ${offer.listing.brand} coupon has expired.`,
        href: `/listings/${offer.listing.id}-${offer.listing.slug}?offerId=${offer.id}`,
      });

      await notifyUser({
        userId: offer.listing.sellerId,
        type: "offer_expired",
        title: "Offer Expired",
        body: `An offer of ${formatPrice(Number(offer.amount))} on your ${offer.listing.brand} coupon has expired.`,
        href: `/listings/${offer.listing.id}-${offer.listing.slug}?offerId=${offer.id}`,
      });

      count++;
    }

    return NextResponse.json({ success: true, expired: count });
  } catch (error) {
    console.error("Cron: Failed to expire offers:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
