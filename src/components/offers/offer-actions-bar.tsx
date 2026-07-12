"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptOffer, rejectOffer, withdrawOffer } from "@/app/actions/offer-actions";
import { CounterOfferDialog } from "./counter-offer-dialog";
import { Button } from "@/components/ui/button";
import { TERMINAL_STATUSES } from "@/lib/offer-constants";
import { Check, X, LogOut, Loader2 } from "lucide-react";

interface OfferActionsBarProps {
  offerId: string;
  offerStatus: string;
  currentAmount: number;
  askingPrice: number;
  brand: string;
  isBuyer: boolean;
  isSeller: boolean;
}

export function OfferActionsBar({
  offerId,
  offerStatus,
  currentAmount,
  askingPrice,
  brand,
  isBuyer,
  isSeller,
}: OfferActionsBarProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTerminal = TERMINAL_STATUSES.includes(
    offerStatus as (typeof TERMINAL_STATUSES)[number]
  );

  if (isTerminal) {
    if (offerStatus === "accepted") {
      return (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            ✅ Offer accepted — payment flow coming in Phase 4
          </p>
        </div>
      );
    }
    return (
      <p className="text-xs text-center text-muted-foreground py-1">
        This negotiation has ended.
      </p>
    );
  }

  async function handleAction(
    action: "accept" | "reject" | "withdraw"
  ) {
    setError(null);
    setLoadingAction(action);

    let result;
    switch (action) {
      case "accept":
        result = await acceptOffer(offerId);
        break;
      case "reject":
        result = await rejectOffer(offerId);
        break;
      case "withdraw":
        result = await withdrawOffer(offerId);
        break;
    }

    setLoadingAction(null);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Action failed.");
    }
  }

  const isLoading = loadingAction !== null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Seller actions on pending offers */}
        {isSeller && offerStatus === "pending" && (
          <>
            <Button
              size="sm"
              className="cursor-pointer gap-1.5"
              onClick={() => handleAction("accept")}
              disabled={isLoading}
            >
              {loadingAction === "accept" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Accept
            </Button>
            <CounterOfferDialog
              offerId={offerId}
              currentAmount={currentAmount}
              askingPrice={askingPrice}
              brand={brand}
            />
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer gap-1.5 text-destructive hover:text-destructive"
              onClick={() => handleAction("reject")}
              disabled={isLoading}
            >
              {loadingAction === "reject" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5" />
              )}
              Reject
            </Button>
          </>
        )}

        {/* Buyer actions on counter-offers */}
        {isBuyer && offerStatus === "countered" && (
          <>
            <Button
              size="sm"
              className="cursor-pointer gap-1.5"
              onClick={() => handleAction("accept")}
              disabled={isLoading}
            >
              {loadingAction === "accept" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Accept Counter
            </Button>
            <CounterOfferDialog
              offerId={offerId}
              currentAmount={currentAmount}
              askingPrice={askingPrice}
              brand={brand}
            />
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer gap-1.5"
              onClick={() => handleAction("withdraw")}
              disabled={isLoading}
            >
              {loadingAction === "withdraw" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              Withdraw
            </Button>
          </>
        )}

        {/* Buyer can withdraw a pending offer */}
        {isBuyer && offerStatus === "pending" && (
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer gap-1.5"
            onClick={() => handleAction("withdraw")}
            disabled={isLoading}
          >
            {loadingAction === "withdraw" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            Withdraw Offer
          </Button>
        )}

        {/* Seller waiting on buyer to respond to counter */}
        {isSeller && offerStatus === "countered" && (
          <p className="text-xs text-muted-foreground">
            Waiting for buyer to respond to your counter-offer…
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
      )}
    </div>
  );
}
