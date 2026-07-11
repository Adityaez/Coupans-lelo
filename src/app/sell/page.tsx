import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { CreateListingForm } from "@/components/listings/create-listing-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sell a Coupon | CouponSwap",
  description:
    "List your unused coupon or gift card on CouponSwap and earn money from deals you won't use.",
};

export default async function SellPage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/login?next=/sell");
  }

  return (
    <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 md:py-12">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Create a Listing
          </h1>
          <p className="text-muted-foreground">
            List your unused coupon or gift card. Buyers will see it on the
            browse page and can make offers.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-border/50 bg-card p-6 md:p-8 shadow-sm">
          <CreateListingForm />
        </div>
      </div>
    </main>
  );
}
