import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { SWRConfig } from "swr";

/**
 * Custom render function that wraps components with necessary providers
 */
function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 0,
        provider: () => new Map(),
      }}
    >
      {children}
    </SWRConfig>
  );
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };
