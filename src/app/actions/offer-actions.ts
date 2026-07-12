"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import {
  makeOfferSchema,
  counterOfferSchema,
  type MakeOfferInput,
  type CounterOfferInput,
} from "@/lib/offer-schemas";
import { calcOfferExpiry, TERMINAL_STATUSES } from "@/lib/offer-constants";
import { notifyUser } from "@/services/notification-service";
import { formatPrice } from "@/lib/listing-constants";

export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ─── Make Offer ──────────────────────────────────────────────

export async function makeOffer(
  input: MakeOfferInput
): Promise<ActionResult & { offerId?: string }> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be logged in to make an offer." };
  }

  const parsed = makeOfferSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const data = parsed.data;

  // Fetch the listing
  const listing = await prisma.listing.findUnique({
    where: { id: data.listingId },
    include: { seller: { select: { id: true, name: true, email: true } } },
  });

  if (!listing) {
    return { success: false, error: "Listing not found." };
  }

  if (listing.status !== "active") {
    return { success: false, error: "This listing is no longer available." };
  }

  if (listing.sellerId === user.id) {
    return { success: false, error: "You cannot make an offer on your own listing." };
  }

  const askingPrice = Number(listing.askingPrice);
  if (data.amount > askingPrice) {
    return {
      success: false,
      error: `Offer cannot exceed the asking price of ${formatPrice(askingPrice)}.`,
      fieldErrors: { amount: [`Cannot exceed ${formatPrice(askingPrice)}`] },
    };
  }

  if (data.amount <= 0) {
    return { success: false, error: "Offer amount must be positive." };
  }

  // Check for existing active offer
  const existing = await prisma.offer.findUnique({
    where: {
      listingId_buyerId: {
        listingId: data.listingId,
        buyerId: user.id,
      },
    },
  });

  if (existing && !TERMINAL_STATUSES.includes(existing.status as typeof TERMINAL_STATUSES[number])) {
    return {
      success: false,
      error: "You already have an active offer on this listing.",
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // If there's an old terminal offer, delete it so we can create a new one
      if (existing) {
        await tx.offerEvent.deleteMany({ where: { offerId: existing.id } });
        await tx.offer.delete({ where: { id: existing.id } });
      }

      const offer = await tx.offer.create({
        data: {
          listingId: data.listingId,
          buyerId: user.id,
          amount: data.amount,
          status: "pending",
          expiresAt: calcOfferExpiry(),
        },
      });

      await tx.offerEvent.create({
        data: {
          offerId: offer.id,
          type: "offer",
          amount: data.amount,
          actorId: user.id,
          message: data.message || null,
        },
      });

      return offer;
    });

    // Notify seller
    const buyerName = user.user_metadata?.name || user.email || "A buyer";
    await notifyUser({
      userId: listing.sellerId,
      type: "new_offer",
      title: "New Offer Received",
      body: `${buyerName} offered ${formatPrice(data.amount)} for your ${listing.brand} coupon (asking ${formatPrice(askingPrice)}).`,
      href: `/listings/${listing.id}-${listing.slug}?offerId=${result.id}`,
    });

    revalidatePath(`/listings/${listing.id}-${listing.slug}`);
    revalidatePath("/dashboard");

    return { success: true, offerId: result.id };
  } catch (error) {
    console.error("Failed to make offer:", error);
    return { success: false, error: "Failed to make offer. Please try again." };
  }
}

// ─── Counter Offer ───────────────────────────────────────────

export async function counterOffer(
  input: CounterOfferInput
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const parsed = counterOfferSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { success: false, error: "Validation failed.", fieldErrors };
  }

  const data = parsed.data;

  const offer = await prisma.offer.findUnique({
    where: { id: data.offerId },
    include: {
      listing: {
        include: { seller: { select: { id: true, name: true } } },
      },
      buyer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!offer) {
    return { success: false, error: "Offer not found." };
  }

  // Determine who is countering — seller counters a pending offer, buyer counters a counter-offer
  const isSeller = offer.listing.sellerId === user.id;
  const isBuyer = offer.buyerId === user.id;

  if (!isSeller && !isBuyer) {
    return { success: false, error: "You are not part of this negotiation." };
  }

  if (isSeller && offer.status !== "pending") {
    return { success: false, error: "You can only counter a pending offer." };
  }

  if (isBuyer && offer.status !== "countered") {
    return { success: false, error: "You can only counter a counter-offer." };
  }

  const askingPrice = Number(offer.listing.askingPrice);
  if (data.amount > askingPrice) {
    return {
      success: false,
      error: `Counter cannot exceed the asking price of ${formatPrice(askingPrice)}.`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.offer.update({
        where: { id: data.offerId },
        data: {
          amount: data.amount,
          status: "countered",
          expiresAt: calcOfferExpiry(),
        },
      });

      await tx.offerEvent.create({
        data: {
          offerId: data.offerId,
          type: "counter",
          amount: data.amount,
          actorId: user.id,
          message: data.message || null,
        },
      });
    });

    // Notify the other party
    const counterPartyId = isSeller ? offer.buyerId : offer.listing.sellerId;
    const counterPartyLabel = isSeller ? "Seller" : "Buyer";
    const actorName = user.user_metadata?.name || user.email || counterPartyLabel;

    await notifyUser({
      userId: counterPartyId,
      type: "counter_offer",
      title: "Counter-Offer Received",
      body: `${actorName} countered with ${formatPrice(data.amount)} on the ${offer.listing.brand} coupon.`,
      href: `/listings/${offer.listing.id}-${offer.listing.slug}?offerId=${offer.id}`,
    });

    revalidatePath(`/listings/${offer.listing.id}-${offer.listing.slug}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to counter offer:", error);
    return { success: false, error: "Failed to send counter-offer." };
  }
}

// ─── Accept Offer ────────────────────────────────────────────

export async function acceptOffer(offerId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      listing: { select: { id: true, slug: true, sellerId: true, brand: true } },
      buyer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!offer) {
    return { success: false, error: "Offer not found." };
  }

  // Both seller and buyer can accept (buyer accepts a counter-offer, seller accepts a pending offer)
  const isSeller = offer.listing.sellerId === user.id;
  const isBuyer = offer.buyerId === user.id;

  if (!isSeller && !isBuyer) {
    return { success: false, error: "You are not part of this negotiation." };
  }

  if (isSeller && offer.status !== "pending") {
    return { success: false, error: "You can only accept a pending offer." };
  }

  if (isBuyer && offer.status !== "countered") {
    return { success: false, error: "You can only accept a counter-offer." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Accept the offer
      await tx.offer.update({
        where: { id: offerId },
        data: { status: "accepted" },
      });

      await tx.offerEvent.create({
        data: {
          offerId,
          type: "accept",
          amount: offer.amount,
          actorId: user.id,
        },
      });

      // Mark listing as negotiating (accepted, pending payment)
      await tx.listing.update({
        where: { id: offer.listingId },
        data: { status: "negotiating" },
      });

      // Auto-reject all other pending/countered offers on this listing
      const otherOffers = await tx.offer.findMany({
        where: {
          listingId: offer.listingId,
          id: { not: offerId },
          status: { in: ["pending", "countered"] },
        },
      });

      for (const other of otherOffers) {
        await tx.offer.update({
          where: { id: other.id },
          data: { status: "rejected" },
        });

        await tx.offerEvent.create({
          data: {
            offerId: other.id,
            type: "reject",
            actorId: user.id,
            message: "Another offer was accepted for this listing.",
          },
        });
      }

      return otherOffers;
    });

    // Notify the buyer/seller that the offer was accepted
    const otherPartyId = isSeller ? offer.buyerId : offer.listing.sellerId;
    const actorName = user.user_metadata?.name || user.email || "The other party";

    await notifyUser({
      userId: otherPartyId,
      type: "offer_accepted",
      title: "Offer Accepted! 🎉",
      body: `${actorName} accepted the offer of ${formatPrice(Number(offer.amount))} for the ${offer.listing.brand} coupon. Proceed to payment.`,
      href: `/listings/${offer.listing.id}-${offer.listing.slug}?offerId=${offer.id}`,
    });

    // Notify other rejected buyers
    const rejectedOffers = await prisma.offer.findMany({
      where: {
        listingId: offer.listingId,
        id: { not: offerId },
        status: "rejected",
      },
      select: { buyerId: true },
    });

    for (const rejected of rejectedOffers) {
      if (rejected.buyerId !== user.id) {
        await notifyUser({
          userId: rejected.buyerId,
          type: "offer_rejected",
          title: "Offer Not Accepted",
          body: `Another offer was accepted for the ${offer.listing.brand} coupon. Keep browsing for more deals!`,
          href: "/listings",
        });
      }
    }

    revalidatePath(`/listings/${offer.listing.id}-${offer.listing.slug}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to accept offer:", error);
    return { success: false, error: "Failed to accept offer." };
  }
}

// ─── Reject Offer ────────────────────────────────────────────

export async function rejectOffer(offerId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      listing: { select: { id: true, slug: true, sellerId: true, brand: true } },
      buyer: { select: { id: true, name: true } },
    },
  });

  if (!offer) {
    return { success: false, error: "Offer not found." };
  }

  if (offer.listing.sellerId !== user.id) {
    return { success: false, error: "Only the seller can reject an offer." };
  }

  if (offer.status !== "pending" && offer.status !== "countered") {
    return { success: false, error: "This offer cannot be rejected." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.offer.update({
        where: { id: offerId },
        data: { status: "rejected" },
      });

      await tx.offerEvent.create({
        data: {
          offerId,
          type: "reject",
          actorId: user.id,
        },
      });
    });

    const sellerName = user.user_metadata?.name || user.email || "The seller";
    await notifyUser({
      userId: offer.buyerId,
      type: "offer_rejected",
      title: "Offer Rejected",
      body: `${sellerName} rejected your offer of ${formatPrice(Number(offer.amount))} for the ${offer.listing.brand} coupon.`,
      href: `/listings/${offer.listing.id}-${offer.listing.slug}?offerId=${offer.id}`,
    });

    revalidatePath(`/listings/${offer.listing.id}-${offer.listing.slug}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to reject offer:", error);
    return { success: false, error: "Failed to reject offer." };
  }
}

// ─── Withdraw Offer ──────────────────────────────────────────

export async function withdrawOffer(offerId: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      listing: { select: { id: true, slug: true, sellerId: true, brand: true } },
    },
  });

  if (!offer) {
    return { success: false, error: "Offer not found." };
  }

  if (offer.buyerId !== user.id) {
    return { success: false, error: "Only the buyer can withdraw an offer." };
  }

  if (TERMINAL_STATUSES.includes(offer.status as typeof TERMINAL_STATUSES[number])) {
    return { success: false, error: "This offer is already finalized." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.offer.update({
        where: { id: offerId },
        data: { status: "withdrawn" },
      });

      await tx.offerEvent.create({
        data: {
          offerId,
          type: "withdraw",
          actorId: user.id,
        },
      });
    });

    const buyerName = user.user_metadata?.name || user.email || "The buyer";
    await notifyUser({
      userId: offer.listing.sellerId,
      type: "offer_withdrawn",
      title: "Offer Withdrawn",
      body: `${buyerName} withdrew their offer of ${formatPrice(Number(offer.amount))} on your ${offer.listing.brand} coupon.`,
      href: `/listings/${offer.listing.id}-${offer.listing.slug}?offerId=${offer.id}`,
    });

    revalidatePath(`/listings/${offer.listing.id}-${offer.listing.slug}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to withdraw offer:", error);
    return { success: false, error: "Failed to withdraw offer." };
  }
}
