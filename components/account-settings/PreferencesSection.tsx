"use client";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { usePreferences } from "@/hooks/account-settings";
import type { AlertMessage } from "@/lib/types/account-settings";

interface PreferencesSectionProps {
  message: AlertMessage | null;
  setMessage: (message: AlertMessage | null) => void;
}

export function PreferencesSection({
  message,
  setMessage,
}: PreferencesSectionProps) {
  const { theme, setTheme } = useTheme();
  const {
    preferences,
    setPreferences,
    isLoading: isUpdatingPreferences,
    debouncedUpdate: debouncedPreferencesUpdate,
  } = usePreferences({
    debounceMs: 500,
    onSuccess: () => {
      setMessage({
        type: "success",
        text: "Preferences updated successfully!",
      });
    },
    onError: (error) => {
      setMessage({ type: "error", text: error });
    },
  });

  // Sync theme with darkMode preference
  useEffect(() => {
    if (preferences.darkMode && theme !== "dark") {
      setTheme("dark");
    } else if (!preferences.darkMode && theme !== "light") {
      setTheme("light");
    }
    // Note: We're not adding theme to dependencies to avoid infinite loop
    // This effect only runs when preferences.darkMode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.darkMode]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications and updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive important updates via email
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => {
                setPreferences((prev) => ({
                  ...prev,
                  emailNotifications: checked,
                }));
                debouncedPreferencesUpdate();
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketingEmails">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive promotional content and product updates
              </p>
            </div>
            <Switch
              id="marketingEmails"
              checked={preferences.marketingEmails}
              onCheckedChange={(checked) => {
                setPreferences((prev) => ({
                  ...prev,
                  marketingEmails: checked,
                }));
                debouncedPreferencesUpdate();
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="darkMode">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              id="darkMode"
              checked={preferences.darkMode}
              onCheckedChange={(checked) => {
                setPreferences((prev) => ({ ...prev, darkMode: checked }));
                debouncedPreferencesUpdate();
              }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
