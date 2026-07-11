"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { createListingSchema, type CreateListingInput } from "@/lib/listing-schemas";
import { slugify } from "@/lib/listing-constants";

export type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createListing(
  input: CreateListingInput
): Promise<ActionResult & { listingSlug?: string }> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be logged in to create a listing." };
  }

  const parsed = createListingSchema.safeParse(input);
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

  try {
    const listing = await prisma.listing.create({
      data: {
        sellerId: user.id,
        brand: data.brand,
        slug: "", // placeholder, will update below
        category: data.category,
        faceValue: data.faceValue,
        askingPrice: data.askingPrice,
        expiryDate: new Date(data.expiryDate),
        couponType: data.couponType,
        imageUrl: data.imageUrl || null,
        description: data.description || null,
      },
    });

    // Generate slug using brand + beginning of ID
    const slug = `${slugify(data.brand)}-${listing.id.slice(0, 8)}`;
    await prisma.listing.update({
      where: { id: listing.id },
      data: { slug },
    });

    revalidatePath("/listings");
    revalidatePath("/dashboard");

    return { success: true, listingSlug: `${listing.id}-${slug}` };
  } catch (error) {
    console.error("Failed to create listing:", error);
    return { success: false, error: "Failed to create listing. Please try again." };
  }
}

export async function updateListing(
  id: string,
  input: CreateListingInput
): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return { success: false, error: "Listing not found." };
  }
  if (listing.sellerId !== user.id) {
    return { success: false, error: "You can only edit your own listings." };
  }

  const parsed = createListingSchema.safeParse(input);
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

  try {
    const slug = `${slugify(data.brand)}-${id.slice(0, 8)}`;
    await prisma.listing.update({
      where: { id },
      data: {
        brand: data.brand,
        slug,
        category: data.category,
        faceValue: data.faceValue,
        askingPrice: data.askingPrice,
        expiryDate: new Date(data.expiryDate),
        couponType: data.couponType,
        imageUrl: data.imageUrl || null,
        description: data.description || null,
      },
    });

    revalidatePath("/listings");
    revalidatePath(`/listings/${id}-${slug}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to update listing:", error);
    return { success: false, error: "Failed to update listing." };
  }
}

export async function deleteListing(id: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return { success: false, error: "Listing not found." };
  }
  if (listing.sellerId !== user.id) {
    return { success: false, error: "You can only delete your own listings." };
  }

  try {
    await prisma.listing.update({
      where: { id },
      data: { status: "removed" },
    });

    revalidatePath("/listings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete listing:", error);
    return { success: false, error: "Failed to delete listing." };
  }
}

export async function markListingSold(id: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return { success: false, error: "Listing not found." };
  }
  if (listing.sellerId !== user.id) {
    return { success: false, error: "You can only mark your own listings as sold." };
  }
  if (listing.status !== "active") {
    return { success: false, error: "Only active listings can be marked as sold." };
  }

  try {
    await prisma.listing.update({
      where: { id },
      data: { status: "sold" },
    });

    revalidatePath("/listings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to mark listing as sold:", error);
    return { success: false, error: "Failed to mark as sold." };
  }
}

export async function reactivateListing(id: string): Promise<ActionResult> {
  const user = await getServerUser();
  if (!user) {
    return { success: false, error: "You must be logged in." };
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return { success: false, error: "Listing not found." };
  }
  if (listing.sellerId !== user.id) {
    return { success: false, error: "You can only reactivate your own listings." };
  }

  try {
    await prisma.listing.update({
      where: { id },
      data: { status: "active" },
    });

    revalidatePath("/listings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to reactivate listing:", error);
    return { success: false, error: "Failed to reactivate listing." };
  }
}
