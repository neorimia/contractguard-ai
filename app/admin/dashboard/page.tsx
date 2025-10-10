// app/admin/dashboard/page.tsx
import { Suspense } from "react";
import { DashboardContent } from "@/components/admin/DashboardContent";
import { DashboardSkeleton } from "@/components/admin/DashboardSkeleton";

export const metadata = {
  title: "Admin Dashboard | ContractGuard AI",
  description: "Analytics and revenue dashboard for ContractGuard AI",
};

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor revenue, conversions, and user engagement across your hybrid
            monetization system.
          </p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
