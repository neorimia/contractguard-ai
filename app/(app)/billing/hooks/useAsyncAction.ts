import { useState } from "react";

/**
 * Reusable hook for handling async actions with loading state and error handling
 * @param asyncFn - The async function to execute
 * @returns Object with execute function and loading state
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  asyncFn: (...args: TArgs) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (...args: TArgs): Promise<TResult | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn(...args);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error("Async action error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setLoading(false);
  };

  return { execute, loading, error, reset };
}
