// app/admin/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/app/admin/components/DashboardContent";
import { DashboardSkeleton } from "@/app/admin/components/DashboardSkeleton";
import { stackServerApp } from "@/stack/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata = {
  title: "Admin Dashboard | ContractGuard AI",
  description: "Analytics and revenue dashboard for ContractGuard AI",
};

async function checkAdminAccess() {
  // Check if user is authenticated
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect("/");
  }

  // Get user from database
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.stackUserId, user.id))
    .limit(1);

  if (!dbUser) {
    redirect("/");
  }

  // Check admin status
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
  const isAdmin = adminEmails.includes(dbUser.email!);

  if (!isAdmin) {
    redirect("/");
  }

  return true;
}

export default async function AdminDashboardPage() {
  // Check admin access before rendering
  await checkAdminAccess();

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
