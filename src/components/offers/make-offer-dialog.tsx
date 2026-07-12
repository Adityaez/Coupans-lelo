"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { makeOffer } from "@/app/actions/offer-actions";
import { formatPrice } from "@/lib/listing-constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Loader2 } from "lucide-react";

interface MakeOfferDialogProps {
  listingId: string;
  askingPrice: number;
  faceValue: number;
  brand: string;
  hasExistingOffer: boolean;
}

export function MakeOfferDialog({
  listingId,
  askingPrice,
  faceValue,
  brand,
  hasExistingOffer,
}: MakeOfferDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(
    Math.round(askingPrice * 0.85).toString()
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suggestedPrice = Math.round(askingPrice * 0.85);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount.");
      setLoading(false);
      return;
    }

    if (numAmount > askingPrice) {
      setError(
        `Offer cannot exceed the asking price of ${formatPrice(askingPrice)}.`
      );
      setLoading(false);
      return;
    }

    const result = await makeOffer({
      listingId,
      amount: numAmount,
      message: message.trim() || undefined,
    });

    setLoading(false);

    if (result.success) {
      setOpen(false);
      setAmount(suggestedPrice.toString());
      setMessage("");
      router.refresh();
    } else {
      setError(result.error || "Failed to make offer.");
    }
  }

  const savings = faceValue - Number(amount || 0);
  const savingsPercent =
    faceValue > 0 ? Math.round((savings / faceValue) * 100) : 0;

  if (hasExistingOffer) {
    return (
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-center">
        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
          You have an active offer on this listing — see the thread below
        </span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="w-full h-12 text-base font-semibold cursor-pointer" />}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Make an Offer
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Make an Offer — {brand}
          </DialogTitle>
          <DialogDescription>
            Asking price: {formatPrice(askingPrice)} · Face value:{" "}
            {formatPrice(faceValue)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="offer-amount">Your Offer (₹)</Label>
            <Input
              id="offer-amount"
              type="number"
              min="1"
              max={askingPrice}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`e.g. ${suggestedPrice}`}
              className="text-lg font-semibold"
              required
            />
            {Number(amount) > 0 && Number(amount) <= faceValue && (
              <p className="text-xs text-muted-foreground">
                You save {formatPrice(savings)} ({savingsPercent}% off face
                value)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-message">
              Message{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="offer-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Can you do a better deal?"
              maxLength={200}
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/200
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                `Offer ${formatPrice(Number(amount) || 0)}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
