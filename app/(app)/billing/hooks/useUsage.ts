import useSWR from "swr";
import type { UsageData } from "../schemas";
import { usageResponseSchema } from "../schemas";

const fetcher = async (url: string): Promise<UsageData> => {
  const response = await fetch(url);
  const data = await response.json();

  // Validate with Zod
  const validated = usageResponseSchema.safeParse(data);
  if (!validated.success) {
    console.error("Invalid usage data:", validated.error);
    throw new Error("Invalid usage data format");
  }

  return validated.data.data;
};

export function useUsage() {
  const { data, error, isLoading, mutate } = useSWR<UsageData>(
    "/api/user/usage",
    fetcher,
    {
      revalidateOnFocus: true, // Revalidate when user returns to tab
      revalidateOnReconnect: true,
      refreshInterval: 60000, // Refresh every minute to keep usage up to date
      dedupingInterval: 5000, // 5 seconds
    }
  );

  return {
    usage: data ?? null,
    isLoading,
    error,
    refetch: mutate,
  };
}
