import type {
  SubscriptionData,
  PaymentMethodData,
  InvoiceData,
  InstantCreditsData,
  UsageData,
} from "@/app/(app)/billing/schemas";

export const mockSubscription: SubscriptionData = {
  id: "sub_test123",
  status: "active",
  tier: "pro",
  currentPeriodStart: new Date("2025-01-01").toISOString(),
  currentPeriodEnd: new Date("2025-02-01").toISOString(),
  cancelAtPeriodEnd: false,
  canceledAt: null,
  interval: "month",
  amount: 2900,
  currency: "usd",
};

export const mockCanceledSubscription: SubscriptionData = {
  ...mockSubscription,
  cancelAtPeriodEnd: true,
  status: "active",
};

export const mockPaymentMethod: PaymentMethodData = {
  id: "pm_test123",
  type: "card",
  card: {
    brand: "visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2025,
  },
};

export const mockInvoices: InvoiceData[] = [
  {
    id: "in_test1",
    number: "INV-001",
    created: new Date("2025-01-01").toISOString(),
    status: "paid",
    amountPaid: 2900,
    currency: "usd",
    description: "Pro Plan - Monthly",
    hostedInvoiceUrl: "https://billing.stripe.com/invoice/test1",
    invoicePdf: "https://billing.stripe.com/invoice/test1.pdf",
  },
  {
    id: "in_test2",
    number: "INV-002",
    created: new Date("2024-12-01").toISOString(),
    status: "paid",
    amountPaid: 2900,
    currency: "usd",
    description: "Pro Plan - Monthly",
    hostedInvoiceUrl: "https://billing.stripe.com/invoice/test2",
    invoicePdf: "https://billing.stripe.com/invoice/test2.pdf",
  },
];

export const mockInstantCredits: InstantCreditsData = {
  balance: 10,
  usedToday: 2,
  totalPurchased: 50,
  recentPurchases: [
    {
      id: "pur_test1",
      type: "instant_credits",
      credits: 10,
      amount: 990,
      currency: "usd",
      status: "completed",
      createdAt: new Date("2025-01-15").toISOString(),
      completedAt: new Date("2025-01-15").toISOString(),
    },
    {
      id: "pur_test2",
      type: "instant_credits",
      credits: 20,
      amount: 1980,
      currency: "usd",
      status: "completed",
      createdAt: new Date("2025-01-10").toISOString(),
      completedAt: new Date("2025-01-10").toISOString(),
    },
  ],
};

export const mockUsage: UsageData = {
  current: {
    scansToday: 5,
    scansThisMonth: 25,
    limit: 100,
    resetAt: new Date("2025-02-01").toISOString(),
  },
  tier: "pro",
};

export const mockUnlimitedUsage: UsageData = {
  current: {
    scansToday: 50,
    scansThisMonth: 500,
    limit: 999999,
    resetAt: new Date("2025-02-01").toISOString(),
  },
  tier: "team",
};

export const mockBillingResponse = {
  status: "success",
  data: {
    subscription: mockSubscription,
    paymentMethod: mockPaymentMethod,
    tier: "pro" as const,
  },
};

export const mockInvoicesResponse = {
  status: "success",
  data: {
    invoices: mockInvoices,
  },
};

export const mockUsageResponse = {
  status: "success",
  data: {
    usage: mockUsage,
  },
};

export const mockCreditsResponse = {
  status: "success",
  data: {
    credits: mockInstantCredits,
  },
};

export const mockUserTierResponse = {
  status: "success",
  tier: "pro" as const,
};

export const mockErrorResponse = {
  status: "error",
  error: "Something went wrong",
};
