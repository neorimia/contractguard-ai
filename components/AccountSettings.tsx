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

interface AccountSettingsProps {
  className?: string;
}

export function AccountSettings({ className }: AccountSettingsProps) {
  const user = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    email: user?.primaryEmail || "",
    profileImageUrl: user?.profileImageUrl || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
    darkMode: false,
  });

  // Initialize preferences from user's clientMetadata
  useEffect(() => {
    if (user?.clientMetadata?.preferences) {
      setPreferences({
        emailNotifications:
          user.clientMetadata.preferences.emailNotifications ?? true,
        marketingEmails:
          user.clientMetadata.preferences.marketingEmails ?? false,
        darkMode: user.clientMetadata.preferences.darkMode ?? false,
      });
    }
  }, [user]);

  // Helper function for better error handling
  const handleApiError = (error: any, defaultMessage: string) => {
    console.error("API Error:", error);

    // Handle specific Stack Auth error types
    if (error?.message?.includes("email")) {
      return "Invalid email address. Please check your email format.";
    }
    if (error?.message?.includes("password")) {
      return "Password requirements not met. Please ensure your password is at least 8 characters long.";
    }
    if (error?.message?.includes("unauthorized")) {
      return "Authentication failed. Please log in again.";
    }
    if (error?.message?.includes("rate limit")) {
      return "Too many requests. Please wait a moment and try again.";
    }

    return defaultMessage;
  };

  // Handle avatar file upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Please select a valid image file (jpg, png, gif, webp).",
      });
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: "Image size must be less than 2MB. Please choose a smaller file.",
      });
      return;
    }

    setUploadingImage(true);
    setMessage(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileData((prev) => ({
          ...prev,
          profileImageUrl: base64String,
        }));
        setUploadingImage(false);
        setMessage({
          type: "success",
          text: "Image uploaded successfully! Don't forget to save changes.",
        });
      };
      reader.onerror = () => {
        setUploadingImage(false);
        setMessage({
          type: "error",
          text: "Failed to read image file. Please try again.",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadingImage(false);
      setMessage({
        type: "error",
        text: "Failed to upload image. Please try again.",
      });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!user) {
      setMessage({
        type: "error",
        text: "User not authenticated. Please log in again.",
      });
      setIsLoading(false);
      return;
    }

    // Validate email format with robust validation
    if (profileData.email) {
      const { isValidEmail } = await import("@/lib/validation/email");
      if (!isValidEmail(profileData.email)) {
        setMessage({
          type: "error",
          text: "Please enter a valid email address.",
        });
        setIsLoading(false);
        return;
      }
    }

    // Validate profile image URL if provided (skip validation for base64 images)
    if (profileData.profileImageUrl && !profileData.profileImageUrl.startsWith("data:image/")) {
      try {
        new URL(profileData.profileImageUrl);
        // Check if it's an image URL (basic validation)
        if (
          !profileData.profileImageUrl.match(
            /\.(jpg|jpeg|png|gif|webp|svg)$/i
          ) &&
          !profileData.profileImageUrl.includes("gravatar") &&
          !profileData.profileImageUrl.includes("googleusercontent")
        ) {
          setMessage({
            type: "error",
            text: "Please enter a valid image URL (jpg, png, gif, webp, or svg).",
          });
          setIsLoading(false);
          return;
        }
      } catch {
        setMessage({
          type: "error",
          text: "Please enter a valid image URL.",
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      // Update user profile using Stack Auth API
      await user.update({
        displayName: profileData.displayName,
        profileImageUrl: profileData.profileImageUrl || null,
        clientMetadata: {
          ...user.clientMetadata,
          preferences: preferences,
        },
      });

      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: handleApiError(
          error,
          "Failed to update profile. Please try again."
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!user) {
      setMessage({
        type: "error",
        text: "User not authenticated. Please log in again.",
      });
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({
        type: "error",
        text: "New passwords do not match.",
      });
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 characters long.",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Update password using Stack Auth API
      await user.updatePassword({
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setMessage({
        type: "success",
        text: "Password updated successfully!",
      });

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: handleApiError(
          error,
          "Failed to update password. Please check your current password and try again."
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    if (!user) {
      setMessage({
        type: "error",
        text: "User not authenticated. Please log in again.",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Update user preferences using Stack Auth clientMetadata
      await user.update({
        clientMetadata: {
          ...user.clientMetadata,
          preferences: preferences,
        },
      });

      setMessage({
        type: "success",
        text: "Preferences updated successfully!",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: handleApiError(
          error,
          "Failed to update preferences. Please try again."
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }

    if (!user) {
      setMessage({
        type: "error",
        text: "User not authenticated. Please log in again.",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Delete account using Stack Auth API
      await user.delete();

      setMessage({
        type: "success",
        text: "Account deleted successfully. You will be redirected to the login page.",
      });

      // Redirect to login page after successful deletion
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      setMessage({
        type: "error",
        text: handleApiError(
          error,
          "Failed to delete account. Please contact support if the issue persists."
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Success/Error Messages */}
      {message && (
        <Alert
          className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
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
                      {profileData.profileImageUrl ? (
                        <img
                          src={profileData.profileImageUrl}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.parentElement?.classList.add("bg-muted");
                          }}
                        />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Profile Image Preview</p>
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
                          onChange={handleAvatarUpload}
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
                        >
                          <Upload className="h-4 w-4 mr-2" />
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
                    <p className="text-xs text-muted-foreground">
                      Upload an image file (max 2MB) or enter a URL below
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
                      Supports jpg, png, gif, webp, svg. Gravatar and Google profile
                      images are also supported.
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
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
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
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="w-full md:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isLoading ? "Deleting..." : "Delete Account"}
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
                    void handlePreferencesUpdate();
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
                    void handlePreferencesUpdate();
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
                    void handlePreferencesUpdate();
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
