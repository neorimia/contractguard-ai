import useSWR from "swr";
import type { InstantCreditsData } from "../schemas";
import { creditsResponseSchema } from "../schemas";

const fetcher = async (url: string): Promise<InstantCreditsData> => {
  const response = await fetch(url);
  const data = await response.json();

  // Validate with Zod
  const validated = creditsResponseSchema.safeParse(data);
  if (!validated.success) {
    console.error("Invalid credits data:", validated.error);
    throw new Error("Invalid credits data format");
  }

  return validated.data.data;
};

export function useInstantCredits() {
  const { data, error, isLoading, mutate } = useSWR<InstantCreditsData>(
    "/api/user/credits",
    fetcher,
    {
      revalidateOnFocus: true, // Revalidate when user returns to tab
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
      dedupingInterval: 5000, // 5 seconds
    }
  );

  return {
    credits: data ?? null,
    isLoading,
    error,
    refetch: mutate,
  };
}
