"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Lock,
  Bell,
  Palette,
  Trash2,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  Upload,
} from "lucide-react";
import {
  useAvatarUpload,
  useProfileUpdate,
  usePasswordChange,
  usePreferences,
} from "@/hooks/account-settings";
import type {
  ProfileData,
  PasswordData,
  AlertMessage,
} from "@/lib/types/account-settings";
import { handleClientApiError } from "@/lib/utils/client-error-handler";

interface AccountSettingsProps {
  className?: string;
}

export function AccountSettings({ className }: AccountSettingsProps) {
  const user = useUser();
  const [message, setMessage] = useState<AlertMessage | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: user?.displayName || "",
    email: user?.primaryEmail || "",
    profileImageUrl: user?.profileImageUrl || "",
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Custom hooks
  const {
    uploadingImage,
    imageError,
    setImageError,
    handleAvatarUpload: uploadAvatar,
  } = useAvatarUpload({
    onSuccess: (imageUrl) => {
      setProfileData((prev) => ({
        ...prev,
        profileImageUrl: imageUrl,
      }));
      setMessage({
        type: "success",
        text: "Image uploaded successfully! Don't forget to save changes.",
      });
    },
    onError: (error) => {
      setMessage({ type: "error", text: error });
    },
    setMessage,
  });

  const { isLoading: isUpdatingProfile, handleProfileUpdate: updateProfile } =
    useProfileUpdate({
      onSuccess: () => {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setHasUnsavedChanges(false);
      },
      onError: (error) => {
        setMessage({ type: "error", text: error });
      },
    });

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

  // Determine overall loading state
  const isLoading =
    isUpdatingProfile || isChangingPassword || isUpdatingPreferences;

  // Handler wrappers for form submissions
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(profileData, preferences);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await changePassword(passwordData);
    // Password fields are cleared by the hook on success
  };

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (message?.type === "success") {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Track unsaved changes in profile form
  useEffect(() => {
    if (!user) return;

    const hasChanges =
      profileData.displayName !== (user?.displayName || "") ||
      profileData.email !== (user?.primaryEmail || "") ||
      profileData.profileImageUrl !== (user?.profileImageUrl || "");

    setHasUnsavedChanges(hasChanges);
  }, [profileData, user]);

  // Warn user about unsaved changes before leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Modern browsers ignore custom messages and show generic warning
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
          "Failed to delete account. Please verify your password and try again.",
        ),
      });
    } finally {
      setIsDeletingAccount(false);
      setDeleteConfirmPassword("");
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Success/Error Messages */}
      {message && (
        <Alert
          role="alert"
          aria-live="polite"
          className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
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
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                {/* Profile Image Preview */}
                {profileData.profileImageUrl && (
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {profileData.profileImageUrl && !imageError ? (
                        <img
                          src={profileData.profileImageUrl}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Profile Image Preview
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This is how your profile image will appear
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profileData.displayName}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          displayName: e.target.value,
                        }))
                      }
                      placeholder="Enter your display name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Image Upload Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Profile Image</Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Upload Button */}
                      <div className="flex-1">
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={uploadAvatar}
                          disabled={uploadingImage}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("avatar-upload")?.click()
                          }
                          disabled={uploadingImage}
                          className="w-full"
                          aria-describedby="image-format-hint"
                        >
                          <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                          {uploadingImage ? "Uploading..." : "Upload Image"}
                        </Button>
                      </div>

                      {/* Clear Button */}
                      {profileData.profileImageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setProfileData((prev) => ({
                              ...prev,
                              profileImageUrl: "",
                            }))
                          }
                          className="sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      )}
                    </div>
                    <p
                      id="image-format-hint"
                      className="text-xs text-muted-foreground"
                    >
                      Upload an image file (max 2MB) or enter a URL below.
                      Accepts JPG, PNG, GIF, WEBP formats.
                    </p>
                  </div>

                  {/* Profile Image URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="profileImageUrl">Or Enter Image URL</Label>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="profileImageUrl"
                        type="url"
                        value={profileData.profileImageUrl}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            profileImageUrl: e.target.value,
                          }))
                        }
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supports jpg, png, gif, webp, svg. Gravatar and Google
                      profile images are also supported.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Email verified on {new Date().toLocaleDateString()}
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full md:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
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
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
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
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
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
                  <Label htmlFor="emailNotifications">
                    Email Notifications
                  </Label>
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
        </TabsContent>
      </Tabs>

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
    </div>
  );
}
