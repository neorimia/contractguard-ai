import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useInvoices } from "@/app/(app)/billing/hooks/useInvoices";
import { mockInvoicesResponse, mockInvoices } from "../utils/mock-data";

global.fetch = vi.fn();

describe("useInvoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch invoices with default limit", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockInvoicesResponse,
    });

    const { result } = renderHook(() => useInvoices());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invoices).toEqual(mockInvoices);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/user/billing/invoices?limit=10"
    );
  });

  it("should fetch invoices with custom limit", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockInvoicesResponse,
    });

    const { result } = renderHook(() => useInvoices({ limit: 5 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/user/billing/invoices?limit=5"
    );
  });

  it("should return empty array on error", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useInvoices());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invoices).toEqual([]);
    expect(result.current.error).toBeDefined();
  });

  it("should provide refetch function", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockInvoicesResponse,
    });

    const { result } = renderHook(() => useInvoices());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    vi.clearAllMocks();

    await result.current.refetch();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should handle empty invoice list", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "success",
        data: { invoices: [] },
      }),
    });

    const { result } = renderHook(() => useInvoices());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invoices).toEqual([]);
    expect(result.current.error).toBe(undefined);
  });
});
