import useSWR from "swr";
import type { InvoiceData } from "../schemas";
import { invoicesResponseSchema } from "../schemas";

interface UseInvoicesOptions {
  limit?: number;
}

const fetcher = async (url: string): Promise<InvoiceData[]> => {
  const response = await fetch(url);
  const data = await response.json();

  // Validate with Zod
  const validated = invoicesResponseSchema.safeParse(data);
  if (!validated.success) {
    console.error("Invalid invoices data:", validated.error);
    throw new Error("Invalid invoices data format");
  }

  return validated.data.data.invoices;
};

export function useInvoices(options: UseInvoicesOptions = {}) {
  const { limit = 10 } = options;

  const { data, error, isLoading, mutate } = useSWR<InvoiceData[]>(
    `/api/user/billing/invoices?limit=${limit}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes - invoices don't change often
    }
  );

  return {
    invoices: data ?? [],
    isLoading,
    error,
    refetch: mutate,
  };
}
