"use client";

import dynamic from "next/dynamic";
import { HeaderSkeleton } from "./HeaderSkeleton";

// Dynamically import Header with no SSR to avoid Stack Auth SSR issues
const HeaderDynamic = dynamic(() => import("./Header").then((mod) => ({ default: mod.Header })), {
  ssr: false,
  loading: () => <HeaderSkeleton />,
});

export function HeaderClient() {
  return <HeaderDynamic />;
}