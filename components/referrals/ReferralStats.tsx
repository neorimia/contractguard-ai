// components/referrals/ReferralStats.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Referral {
  id: string;
  status: string;
  createdAt: Date | string;
  confirmedAt?: Date | string | null;
  rewardAmount?: number | null;
}

interface ReferralStatsProps {
  referrals: Referral[];
}

export function ReferralStats({ referrals }: ReferralStatsProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
      case "rewarded":
        return <Badge variant="default">Confirmed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No referrals yet. Share your link to get started!
          </p>
        ) : (
          <div className="space-y-4">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div>
                  <div className="font-medium">
                    {referral.status === "confirmed" || referral.status === "rewarded"
                      ? "Friend joined!"
                      : "Pending signup"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(referral.createdAt)}
                  </div>
                </div>

                <div className="text-right">
                  {getStatusBadge(referral.status)}

                  {referral.rewardAmount && (
                    <div className="mt-1 text-sm font-medium text-green-600">
                      +{referral.rewardAmount} scans
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}