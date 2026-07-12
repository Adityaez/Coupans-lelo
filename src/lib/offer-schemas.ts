import * as z from "zod";

export const makeOfferSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  amount: z
    .number({ message: "Offer amount must be a number" })
    .positive("Offer amount must be positive"),
  message: z
    .string()
    .max(200, "Message too long (max 200 characters)")
    .optional()
    .or(z.literal("")),
});

export type MakeOfferInput = z.infer<typeof makeOfferSchema>;

export const counterOfferSchema = z.object({
  offerId: z.string().min(1, "Offer ID is required"),
  amount: z
    .number({ message: "Counter amount must be a number" })
    .positive("Counter amount must be positive"),
  message: z
    .string()
    .max(200, "Message too long (max 200 characters)")
    .optional()
    .or(z.literal("")),
});

export type CounterOfferInput = z.infer<typeof counterOfferSchema>;

export const respondOfferSchema = z.object({
  offerId: z.string().min(1, "Offer ID is required"),
});

export type RespondOfferInput = z.infer<typeof respondOfferSchema>;
