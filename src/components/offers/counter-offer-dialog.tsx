"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { counterOffer } from "@/app/actions/offer-actions";
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
import { ArrowLeftRight, Loader2 } from "lucide-react";

interface CounterOfferDialogProps {
  offerId: string;
  currentAmount: number;
  askingPrice: number;
  brand: string;
}

export function CounterOfferDialog({
  offerId,
  currentAmount,
  askingPrice,
  brand,
}: CounterOfferDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError(`Cannot exceed asking price of ${formatPrice(askingPrice)}.`);
      setLoading(false);
      return;
    }

    const result = await counterOffer({
      offerId,
      amount: numAmount,
      message: message.trim() || undefined,
    });

    setLoading(false);

    if (result.success) {
      setOpen(false);
      setAmount("");
      setMessage("");
      router.refresh();
    } else {
      setError(result.error || "Failed to send counter-offer.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="cursor-pointer gap-1.5" />
        }
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
        Counter
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Counter-Offer — {brand}</DialogTitle>
          <DialogDescription>
            Current offer: {formatPrice(currentAmount)} · Asking:{" "}
            {formatPrice(askingPrice)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="counter-amount">Your Counter (₹)</Label>
            <Input
              id="counter-amount"
              type="number"
              min="1"
              max={askingPrice}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`e.g. ${Math.round((currentAmount + askingPrice) / 2)}`}
              className="text-lg font-semibold"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="counter-message">
              Message{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="counter-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. This is my best price"
              maxLength={200}
              rows={2}
              className="resize-none"
            />
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
                "Send Counter"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
