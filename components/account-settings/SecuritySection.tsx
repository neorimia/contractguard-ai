"use client";

import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Eye, EyeOff, AlertCircle, Trash2 } from "lucide-react";
import { usePasswordChange } from "@/hooks/account-settings";
import type { PasswordData, AlertMessage } from "@/lib/types/account-settings";
import { handleClientApiError } from "@/lib/utils/client-error-handler";

interface SecuritySectionProps {
  message: AlertMessage | null;
  setMessage: (message: AlertMessage | null) => void;
}

export function SecuritySection({ message, setMessage }: SecuritySectionProps) {
  const user = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Form state
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Custom hooks
  const {
    isLoading: isChangingPassword,
    isPasswordAuthEnabled,
    handlePasswordChange: changePassword,
  } = usePasswordChange({
    onSuccess: () => {
      setMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      setMessage({ type: "error", text: error });
    },
  });

  const isLoading = isChangingPassword;

  // Handler for password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    await changePassword(passwordData);
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      setMessage({
        type: "error",
        text: "User not authenticated. Please log in again.",
      });
      return;
    }

    // Validate password confirmation
    if (!deleteConfirmPassword) {
      setMessage({
        type: "error",
        text: "Please enter your password to confirm account deletion.",
      });
      return;
    }

    setIsDeletingAccount(true);
    setMessage(null);

    try {
      // Verify password before deletion
      await user.updatePassword({
        oldPassword: deleteConfirmPassword,
        newPassword: deleteConfirmPassword, // Same password to verify
      });

      // Delete account using Stack Auth API
      await user.delete();

      setMessage({
        type: "success",
        text: "Account deleted successfully. You will be redirected to the login page.",
      });

      // Close dialog and redirect
      setShowDeleteDialog(false);
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: handleClientApiError(
          error,
          "Failed to delete account. Please verify your password and try again."
        ),
      });
    } finally {
      setIsDeletingAccount(false);
      setDeleteConfirmPassword("");
    }
  };

  return (
    <>
      {/* Only show password change if password auth is enabled */}
      {isPasswordAuthEnabled ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Confirm new password"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Lock className="h-4 w-4 mr-2" />
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You signed in with a social provider (Google, GitHub, etc.).
            Password management is handled by your provider.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                Enter your password to confirm
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isDeletingAccount}
              />
            </div>
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Warning: All your audits, data, and settings will be permanently
                deleted.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmPassword("");
              }}
              disabled={isDeletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || !deleteConfirmPassword}
            >
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
