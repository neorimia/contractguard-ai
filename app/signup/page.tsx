"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useStackApp } from "@stackframe/stack";
import { useRouter } from "next/navigation";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  general?: string;
}

export default function SignupPage() {
  const stackApp = useStackApp();
  const router = useRouter();

  // Check if Stack Auth is configured
  const isStackConfigured = !!stackApp;

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleEmailSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!stackApp) {
      setErrors({
        general: "Authentication not configured. Please contact support.",
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Sign up with Stack Auth
      const result = await stackApp.signUpWithCredential({
        email: formData.email,
        password: formData.password,
      });

      // Update user profile with first/last name after signup
      if (result) {
        try {
          await fetch('/api/user/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: formData.firstName,
              lastName: formData.lastName,
            }),
          });
        } catch (profileErr) {
          console.error("Failed to update profile:", profileErr);
          // Don't block signup if profile update fails
        }
      }

      // Redirect to email verification page
      router.push("/verify-email-sent");
    } catch (err: unknown) {
      console.error("Signup error:", err);
      setErrors({
        general: err instanceof Error
          ? err.message
          : "Signup failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!stackApp) {
      setErrors({
        general: "Authentication not configured. Please contact support.",
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await stackApp.signInWithOAuth("google");
    } catch (err: unknown) {
      console.error("Google signup error:", err);
      setErrors({
        general: err instanceof Error
          ? err.message
          : "Google signup failed. Please try again.",
      });
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    if (!stackApp) {
      setErrors({
        general: "Authentication not configured. Please contact support.",
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await stackApp.signInWithOAuth("github");
    } catch (err: unknown) {
      console.error("GitHub signup error:", err);
      setErrors({
        general: err instanceof Error
          ? err.message
          : "GitHub signup failed. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[3fr_2.5fr] bg-gray-50 dark:bg-black/30">
      {/* Left side - Image background with content */}
      <div className="relative flex flex-col items-center justify-center p-8">
        {/* Background Image */}
        <div className="absolute inset-4 z-0 rounded-xl overflow-hidden">
          <Image
            src="/bg-glass-3.png"
            alt="Background"
            fill
            className="object-cover object-bottom"
            priority
          />
        </div>

        {/* Content overlay */}
        <div className="relative z-10 text-center text-white space-y-6 max-w-md">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tighter">
              🛡️ ContractGuard AI
            </h1>
          </div>

          {/* Main Title */}
          <h2 className="text-3xl font-semibold leading-tight tracking-tighter">
            Start protecting your crypto investments today.
          </h2>

          {/* Subtitle */}
          <p className="text-lg text-gray-200 leading-relaxed tracking-tighter">
            Join 1000+ traders using AI to detect scams and secure their
            investments in the bull market.
          </p>
        </div>
      </div>

      {/* Right side - Sign up form */}
      <div className="flex flex-col justify-center p-12">
        <div className="w-full max-w-lg mx-auto">
          {/* Header */}
          <div className="space-y-2 text-center mb-8">
            <h1 className="text-2xl font-bold bg-linear-to-r from-zinc-800 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent tracking-tighter">
              Create your account
            </h1>
            <p className="text-base text-zinc-500 dark:text-zinc-400 tracking-tighter">
              Join our community today
            </p>
          </div>

          <div className="space-y-6">
            {/* Stack Auth configuration warning */}
            {!isStackConfigured && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-400 tracking-tighter font-medium mb-1">
                  ⚠️ Authentication Not Configured
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-500 tracking-tighter">
                  Stack Auth credentials are missing. Please add <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 rounded">NEXT_PUBLIC_STACK_PROJECT_ID</code> and <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 rounded">NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY</code> to your <code className="px-1 py-0.5 bg-yellow-100 dark:bg-yellow-900/40 rounded">.env.local</code> file.
                </p>
              </div>
            )}

            {/* Error message */}
            {errors.general && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 tracking-tighter">
                  {errors.general}
                </p>
              </div>
            )}

            {/* Social buttons row */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="h-12 relative group
                            bg-zinc-50 dark:bg-[#1a1a1a]
                            hover:bg-white dark:hover:bg-[#222222]
                            border-zinc-200 dark:border-zinc-800/50
                            hover:border-zinc-300 dark:hover:border-zinc-700
                            ring-1 ring-zinc-100 dark:ring-zinc-800/50
                            transition duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-medium text-zinc-700 dark:text-zinc-300 tracking-tighter">
                  Sign up with Google
                </span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleGithubSignup}
                disabled={loading}
                className="h-12 relative group
                            bg-zinc-50 dark:bg-[#1a1a1a]
                            hover:bg-white dark:hover:bg-[#222222]
                            border-zinc-200 dark:border-zinc-800/50
                            hover:border-zinc-300 dark:hover:border-zinc-700
                            ring-1 ring-zinc-100 dark:ring-zinc-800/50
                            transition duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Github className="mr-2 h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300 tracking-tighter">
                  Sign up with Github
                </span>
              </Button>
            </div>

            {/* Delimiter */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-50 dark:bg-black/30 px-4 text-zinc-400 dark:text-zinc-500 font-medium tracking-tighter">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Form inputs */}
            <form onSubmit={handleEmailSignup} className="space-y-4">
              {/* First name and Last name row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300 tracking-tighter"
                  >
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange("firstName")}
                    disabled={loading}
                    className={`h-12 bg-zinc-50 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800/50 ${
                      errors.firstName ? "border-red-500 dark:border-red-500" : ""
                    }`}
                    aria-invalid={!!errors.firstName}
                    aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="text-sm text-red-600 dark:text-red-400 tracking-tighter">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300 tracking-tighter"
                  >
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange("lastName")}
                    disabled={loading}
                    className={`h-12 bg-zinc-50 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800/50 ${
                      errors.lastName ? "border-red-500 dark:border-red-500" : ""
                    }`}
                    aria-invalid={!!errors.lastName}
                    aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  />
                  {errors.lastName && (
                    <p id="lastName-error" className="text-sm text-red-600 dark:text-red-400 tracking-tighter">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email full row */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 tracking-tighter"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  disabled={loading}
                  className={`h-12 bg-zinc-50 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800/50 ${
                    errors.email ? "border-red-500 dark:border-red-500" : ""
                  }`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-600 dark:text-red-400 tracking-tighter">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password full row */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 tracking-tighter"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Choose your password"
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    disabled={loading}
                    className={`h-12 bg-zinc-50 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800/50 pr-12 ${
                      errors.password ? "border-red-500 dark:border-red-500" : ""
                    }`}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-red-600 dark:text-red-400 tracking-tighter">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 relative group overflow-hidden
                            bg-linear-to-r from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-200
                            text-white dark:text-[#121212] font-medium
                            shadow-lg shadow-zinc-200/20 dark:shadow-black/20
                            hover:from-orange-500 hover:to-orange-700 dark:hover:from-orange-400 dark:hover:to-orange-600
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-300"
              >
                <div className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium tracking-tighter">
                        Creating account...
                      </span>
                    </>
                  ) : (
                    <span className="font-medium tracking-tighter">
                      Create account
                    </span>
                  )}
                </div>
              </Button>
            </form>

            {/* Sign in link */}
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 tracking-tighter">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-zinc-800 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-200
                        transition-colors underline underline-offset-4 decoration-zinc-200 dark:decoration-zinc-700
                        font-medium tracking-tighter"
              >
                Sign in
              </Link>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-6 tracking-tighter">
              By continuing, you agree to our{" "}
              <Link
                href="/terms"
                className="text-zinc-800 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-200
                        transition-colors underline underline-offset-4 decoration-zinc-200 dark:decoration-zinc-700
                        font-medium tracking-tighter"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-zinc-800 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-200
                        transition-colors underline underline-offset-4 decoration-zinc-200 dark:decoration-zinc-700
                        font-medium tracking-tighter"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
