import * as z from "zod";
import { CATEGORIES, COUPON_TYPES } from "./listing-constants";

const baseListingSchema = z.object({
  brand: z
    .string()
    .min(1, "Brand name is required")
    .max(100, "Brand name too long"),
  category: z.enum(CATEGORIES, {
    message: "Please select a category",
  }),
  faceValue: z
    .number({ message: "Face value must be a number" })
    .positive("Face value must be positive")
    .max(1_000_000, "Face value too high"),
  askingPrice: z
    .number({ message: "Asking price must be a number" })
    .positive("Asking price must be positive")
    .max(1_000_000, "Asking price too high"),
  expiryDate: z
    .string()
    .min(1, "Expiry date is required")
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date > new Date();
      },
      { message: "Expiry date must be a valid date in the future" }
    ),
  couponType: z.enum(COUPON_TYPES, {
    message: "Please select a coupon type",
  }),
  imageUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, "Description too long (max 500 characters)")
    .optional()
    .or(z.literal("")),
});

export const createListingSchema = baseListingSchema.refine(
  (data) => data.askingPrice < data.faceValue,
  {
    message:
      "Asking price must be less than face value — otherwise it's not a deal!",
    path: ["askingPrice"],
  }
);

export type CreateListingInput = z.infer<typeof createListingSchema>;

export const updateListingSchema = baseListingSchema
  .extend({ id: z.string().min(1) })
  .refine((data) => data.askingPrice < data.faceValue, {
    message:
      "Asking price must be less than face value — otherwise it's not a deal!",
    path: ["askingPrice"],
  });

export type UpdateListingInput = z.infer<typeof updateListingSchema>;
