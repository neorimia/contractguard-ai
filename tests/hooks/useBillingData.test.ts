import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBillingData } from "@/app/(app)/billing/hooks/useBillingData";
import { mockBillingResponse, mockErrorResponse } from "../utils/mock-data";

// Mock fetch globally
global.fetch = vi.fn();

describe("useBillingData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return billing data successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBillingResponse,
    });

    const { result } = renderHook(() => useBillingData());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.subscription).toBe(null);
    expect(result.current.paymentMethod).toBe(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.subscription).toEqual(
      mockBillingResponse.data.subscription
    );
    expect(result.current.paymentMethod).toEqual(
      mockBillingResponse.data.paymentMethod
    );
    expect(result.current.tier).toBe("pro");
    expect(result.current.error).toBe(undefined);
  });

  it("should handle fetch errors gracefully", async () => {
    (global.fetch as any).mockRejectedValueOnce(
      new Error("Network error")
    );

    const { result } = renderHook(() => useBillingData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.subscription).toBe(null);
    expect(result.current.paymentMethod).toBe(null);
  });

  it("should handle invalid response format", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: "data" }),
    });

    const { result } = renderHook(() => useBillingData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it("should provide refetch function", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockBillingResponse,
    });

    const { result } = renderHook(() => useBillingData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear mock calls
    vi.clearAllMocks();

    // Trigger refetch
    await result.current.refetch();

    // Should have called fetch again
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should return default tier when not provided", async () => {
    const responseWithoutTier = {
      status: "success",
      data: {
        subscription: mockBillingResponse.data.subscription,
        paymentMethod: mockBillingResponse.data.paymentMethod,
        // tier is missing
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => responseWithoutTier,
    });

    const { result } = renderHook(() => useBillingData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tier).toBe("free");
  });
});
