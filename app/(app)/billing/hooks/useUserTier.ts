import useSWR from "swr";
import { userTierResponseSchema } from "../schemas";

const fetcher = async (url: string): Promise<"free" | "starter" | "pro" | "team"> => {
  const response = await fetch(url);
  const data = await response.json();

  // Validate with Zod
  const validated = userTierResponseSchema.safeParse(data);
  if (!validated.success || !validated.data.tier) {
    console.error("Invalid user tier response:", validated.error);
    return "free"; // Default fallback
  }

  return validated.data.tier;
};

export function useUserTier() {
  const { data, error, isLoading, mutate } = useSWR<"free" | "starter" | "pro" | "team">(
    "/api/user/profile",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes - tier doesn't change often
    }
  );

  return {
    tier: data ?? "free",
    isLoading,
    error,
    refetch: mutate,
  };
}
