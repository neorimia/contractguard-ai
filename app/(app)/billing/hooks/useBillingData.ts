import useSWR from "swr";
import type {
  SubscriptionData,
  PaymentMethodData,
} from "../schemas";
import { billingResponseSchema } from "../schemas";

interface BillingData {
  subscription: SubscriptionData | null;
  paymentMethod: PaymentMethodData | null;
  tier: "free" | "starter" | "pro" | "team";
}

const fetcher = async (url: string): Promise<BillingData> => {
  const response = await fetch(url);
  const data = await response.json();

  // Validate with Zod
  const validated = billingResponseSchema.safeParse(data);
  if (!validated.success) {
    console.error("Invalid billing data:", validated.error);
    throw new Error("Invalid billing data format");
  }

  return {
    subscription: validated.data.data.subscription,
    paymentMethod: validated.data.data.paymentMethod,
    tier: validated.data.data.tier || "free",
  };
};

export function useBillingData() {
  const { data, error, isLoading, mutate } = useSWR<BillingData>(
    "/api/user/billing",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    subscription: data?.subscription ?? null,
    paymentMethod: data?.paymentMethod ?? null,
    tier: data?.tier ?? "free",
    isLoading,
    error,
    refetch: mutate,
  };
}
