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
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Save,
  CheckCircle,
  ImageIcon,
  Upload,
  Trash2,
} from "lucide-react";
import {
  useAvatarUpload,
  useProfileUpdate,
  usePreferences,
} from "@/hooks/account-settings";
import type { ProfileData, AlertMessage } from "@/lib/types/account-settings";

interface ProfileSectionProps {
  message: AlertMessage | null;
  setMessage: (message: AlertMessage | null) => void;
}

export function ProfileSection({ message, setMessage }: ProfileSectionProps) {
  const user = useUser();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: user?.displayName || "",
    email: user?.primaryEmail || "",
    profileImageUrl: user?.profileImageUrl || "",
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

  const { preferences } = usePreferences({
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

  const isLoading = isUpdatingProfile;

  // Handler for form submission
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(profileData, preferences);
  };

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
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
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
                Upload an image file (max 2MB) or enter a URL below. Accepts
                JPG, PNG, GIF, WEBP formats.
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
            <Badge variant="secondary" className="flex items-center gap-1">
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
  );
}
