"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock, Bell, CheckCircle, AlertCircle } from "lucide-react";
import type { AlertMessage } from "@/lib/types/account-settings";
import { ProfileSection } from "./account-settings/ProfileSection";
import { SecuritySection } from "./account-settings/SecuritySection";
import { PreferencesSection } from "./account-settings/PreferencesSection";

interface AccountSettingsProps {
  className?: string;
}

export function AccountSettings({ className }: AccountSettingsProps) {
  const [message, setMessage] = useState<AlertMessage | null>(null);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Success/Error Messages */}
      {message && (
        <Alert
          role="alert"
          aria-live="polite"
          className={`mb-6 ${
            message.type === "success"
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle
              className="h-4 w-4 text-green-600"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
          )}
          <AlertDescription
            className={
              message.type === "success" ? "text-green-800" : "text-red-800"
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <ProfileSection message={message} setMessage={setMessage} />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <PreferencesSection message={message} setMessage={setMessage} />
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <SecuritySection message={message} setMessage={setMessage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
