import { z } from "zod";

// Subscription data schema
export const subscriptionDataSchema = z.object({
  id: z.string(),
  status: z.string(),
  tier: z.enum(["free", "starter", "pro", "team"]),
  currentPeriodStart: z.string().nullable(),
  currentPeriodEnd: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean().nullable(),
  canceledAt: z.string().nullable(),
  amount: z.number().nullable(),
  currency: z.string().nullable(),
  interval: z.string().nullable(),
});

// Payment method schema
export const paymentMethodSchema = z.object({
  id: z.string(),
  type: z.string(),
  card: z.object({
    brand: z.string(),
    last4: z.string(),
    expMonth: z.number(),
    expYear: z.number(),
  }),
});

// Invoice schema
export const invoiceSchema = z.object({
  id: z.string(),
  number: z.string(),
  status: z.string(),
  amountPaid: z.number(),
  currency: z.string(),
  created: z.string(),
  hostedInvoiceUrl: z.string(),
  invoicePdf: z.string(),
  description: z.string(),
});

// Purchase schema
export const purchaseSchema = z.object({
  id: z.string(),
  type: z.enum(["instant_credits", "pro_subscription", "team_subscription"]),
  credits: z.number().nullable(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
});

// Instant credits schema
export const instantCreditsSchema = z.object({
  balance: z.number(),
  usedToday: z.number(),
  totalPurchased: z.number(),
  recentPurchases: z.array(purchaseSchema),
});

// Usage data schema
export const usageDataSchema = z.object({
  current: z.object({
    scansToday: z.number(),
    scansThisMonth: z.number(),
    limit: z.number(),
    resetAt: z.string(),
  }),
  tier: z.string(),
});

// API response schemas
export const billingResponseSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    subscription: subscriptionDataSchema.nullable(),
    paymentMethod: paymentMethodSchema.nullable(),
    tier: z.enum(["free", "starter", "pro", "team"]).optional(),
  }),
});

export const invoicesResponseSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    invoices: z.array(invoiceSchema),
  }),
});

export const usageResponseSchema = z.object({
  status: z.literal("success"),
  data: usageDataSchema,
});

export const creditsResponseSchema = z.object({
  status: z.literal("success"),
  data: instantCreditsSchema,
});

export const userTierResponseSchema = z.object({
  tier: z.enum(["free", "starter", "pro", "team"]).optional(),
});

// Types inferred from schemas
export type SubscriptionData = z.infer<typeof subscriptionDataSchema>;
export type PaymentMethodData = z.infer<typeof paymentMethodSchema>;
export type InvoiceData = z.infer<typeof invoiceSchema>;
export type PurchaseData = z.infer<typeof purchaseSchema>;
export type InstantCreditsData = z.infer<typeof instantCreditsSchema>;
export type UsageData = z.infer<typeof usageDataSchema>;
