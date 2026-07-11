import { redirect, notFound } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditListingForm } from "@/components/listings/edit-listing-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Listing | CouponSwap",
};

type Params = Promise<{ id: string }>;

export default async function EditListingPage(props: {
  params: Params;
}) {
  const { id } = await props.params;
  const user = await getServerUser();
  if (!user) {
    redirect(`/login?next=/sell/edit/${id}`);
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listing) {
    notFound();
  }

  if (listing.sellerId !== user.id) {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 md:py-12">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Edit Listing</h1>
          <p className="text-muted-foreground">
            Update the details for your{" "}
            <span className="font-semibold text-foreground">
              {listing.brand}
            </span>{" "}
            listing.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-border/50 bg-card p-6 md:p-8 shadow-sm">
          <EditListingForm
            listing={{
              id: listing.id,
              brand: listing.brand,
              category: listing.category,
              faceValue: Number(listing.faceValue),
              askingPrice: Number(listing.askingPrice),
              expiryDate: listing.expiryDate.toISOString(),
              couponType: listing.couponType,
              imageUrl: listing.imageUrl,
              description: listing.description,
            }}
          />
        </div>
      </div>
    </main>
  );
}
