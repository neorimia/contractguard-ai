import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUsage } from "@/app/(app)/billing/hooks/useUsage";
import { mockUsageResponse, mockUsage } from "../utils/mock-data";

global.fetch = vi.fn();

describe("useUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch usage data successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsageResponse,
    });

    const { result } = renderHook(() => useUsage());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.usage).toEqual(mockUsage);
    expect(result.current.error).toBe(undefined);
  });

  it("should return null usage on error", async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useUsage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.usage).toBe(null);
    expect(result.current.error).toBeDefined();
  });

  it("should provide refetch function", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockUsageResponse,
    });

    const { result } = renderHook(() => useUsage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    vi.clearAllMocks();

    await result.current.refetch();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/user/billing/usage");
  });

  it("should handle invalid response format", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: "data" }),
    });

    const { result } = renderHook(() => useUsage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.usage).toBe(null);
    expect(result.current.error).toBeDefined();
  });

  it("should handle missing usage data in response", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "success",
        data: {},
      }),
    });

    const { result } = renderHook(() => useUsage());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.usage).toBe(null);
  });
});
