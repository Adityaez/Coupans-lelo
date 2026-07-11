"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Tag,
  IndianRupee,
  Calendar,
  ImageIcon,
  FileText,
  Save,
  PercentIcon,
} from "lucide-react";
import { createListingSchema, type CreateListingInput } from "@/lib/listing-schemas";
import { CATEGORIES, COUPON_TYPES, calcDiscount, formatPrice } from "@/lib/listing-constants";
import { updateListing } from "@/app/actions/listing-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type EditListingFormProps = {
  listing: {
    id: string;
    brand: string;
    category: string;
    faceValue: number;
    askingPrice: number;
    expiryDate: string;
    couponType: string;
    imageUrl: string | null;
    description: string | null;
  };
};

export function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      brand: listing.brand,
      category: listing.category as CreateListingInput["category"],
      faceValue: listing.faceValue,
      askingPrice: listing.askingPrice,
      expiryDate: new Date(listing.expiryDate).toISOString().split("T")[0],
      couponType: listing.couponType as CreateListingInput["couponType"],
      imageUrl: listing.imageUrl || "",
      description: listing.description || "",
    },
  });

  const watchFaceValue = watch("faceValue");
  const watchAskingPrice = watch("askingPrice");

  const discount =
    watchFaceValue && watchAskingPrice
      ? calcDiscount(watchFaceValue, watchAskingPrice)
      : null;

  const onSubmit = async (data: CreateListingInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await updateListing(listing.id, data);

      if (!result.success) {
        setServerError(result.error || "Something went wrong.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for input[type="date"] default value
  const defaultDate = listing.expiryDate
    ? new Date(listing.expiryDate).toISOString().split("T")[0]
    : "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Brand */}
      <div className="space-y-2">
        <Label htmlFor="brand" className="text-sm font-medium">
          <Tag className="inline h-4 w-4 mr-1.5 opacity-60" />
          Brand Name
        </Label>
        <Input
          id="brand"
          placeholder="e.g. Amazon, Flipkart, Zomato"
          className="h-11"
          {...register("brand")}
        />
        {errors.brand && (
          <p className="text-xs text-destructive">{errors.brand.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium">
          Category
        </Label>
        <Select
          defaultValue={listing.category}
          onValueChange={(val) => {
            if (val) setValue("category", val as CreateListingInput["category"]);
          }}
        >
          <SelectTrigger id="category" className="h-11">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* Face Value & Asking Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="faceValue" className="text-sm font-medium">
            <IndianRupee className="inline h-4 w-4 mr-1 opacity-60" />
            Face Value
          </Label>
          <Input
            id="faceValue"
            type="number"
            step="0.01"
            min="1"
            placeholder="₹ Original value"
            className="h-11"
            {...register("faceValue", { valueAsNumber: true })}
          />
          {errors.faceValue && (
            <p className="text-xs text-destructive">{errors.faceValue.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="askingPrice" className="text-sm font-medium">
            <IndianRupee className="inline h-4 w-4 mr-1 opacity-60" />
            Asking Price
          </Label>
          <Input
            id="askingPrice"
            type="number"
            step="0.01"
            min="1"
            placeholder="₹ Your price"
            className="h-11"
            {...register("askingPrice", { valueAsNumber: true })}
          />
          {errors.askingPrice && (
            <p className="text-xs text-destructive">{errors.askingPrice.message}</p>
          )}
        </div>
      </div>

      {/* Discount preview */}
      {discount !== null && discount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
          <PercentIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {discount}% discount
          </span>
          <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
            — Buyers save{" "}
            {watchFaceValue && watchAskingPrice
              ? formatPrice(watchFaceValue - watchAskingPrice)
              : ""}
          </span>
        </div>
      )}

      {/* Expiry Date */}
      <div className="space-y-2">
        <Label htmlFor="expiryDate" className="text-sm font-medium">
          <Calendar className="inline h-4 w-4 mr-1.5 opacity-60" />
          Expiry Date
        </Label>
        <Input
          id="expiryDate"
          type="date"
          className="h-11"
          defaultValue={defaultDate}
          min={new Date().toISOString().split("T")[0]}
          {...register("expiryDate")}
        />
        {errors.expiryDate && (
          <p className="text-xs text-destructive">{errors.expiryDate.message}</p>
        )}
      </div>

      {/* Coupon Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Coupon Type</Label>
        <div className="flex gap-3">
          {COUPON_TYPES.map((type) => (
            <label
              key={type}
              className="flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border border-border cursor-pointer transition-all hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-1 has-[:checked]:ring-primary/20"
            >
              <input
                type="radio"
                value={type}
                defaultChecked={listing.couponType === type}
                className="sr-only"
                {...register("couponType")}
              />
              <span className="text-sm font-medium capitalize">{type}</span>
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {type === "code" ? "Digital" : "Physical"}
              </Badge>
            </label>
          ))}
        </div>
        {errors.couponType && (
          <p className="text-xs text-destructive">{errors.couponType.message}</p>
        )}
      </div>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="imageUrl" className="text-sm font-medium">
          <ImageIcon className="inline h-4 w-4 mr-1.5 opacity-60" />
          Image URL{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="imageUrl"
          type="url"
          placeholder="https://example.com/coupon-image.jpg"
          className="h-11"
          {...register("imageUrl")}
        />
        {errors.imageUrl && (
          <p className="text-xs text-destructive">{errors.imageUrl.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          <FileText className="inline h-4 w-4 mr-1.5 opacity-60" />
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Any extra details..."
          rows={3}
          className="resize-none"
          maxLength={500}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        size="lg"
        className="w-full h-12 text-base font-semibold cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Changes…
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </>
        )}
      </Button>
    </form>
  );
}
