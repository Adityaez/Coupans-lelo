import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";

type RouteParams = { params: Promise<{ offerId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { offerId } = await params;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      listing: { select: { sellerId: true } },
    },
  });

  if (!offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  // Only buyer or seller can view events
  if (offer.buyerId !== user.id && offer.listing.sellerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await prisma.offerEvent.findMany({
    where: { offerId },
    include: {
      actor: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    offer: {
      id: offer.id,
      amount: offer.amount,
      status: offer.status,
      expiresAt: offer.expiresAt,
      buyerId: offer.buyerId,
      listingId: offer.listingId,
      sellerId: offer.listing.sellerId,
    },
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      amount: e.amount ? Number(e.amount) : null,
      actorId: e.actorId,
      actorName: e.actor.name || "User",
      message: e.message,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
