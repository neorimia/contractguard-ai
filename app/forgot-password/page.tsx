"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
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
                        Reset your password and get back to protecting your investments.
                    </h2>

                    {/* Subtitle */}
                    <p className="text-lg text-gray-200 leading-relaxed tracking-tighter">
                        We'll send you a secure link to reset your password and regain access to your account.
                    </p>
                </div>
            </div>

            {/* Right side - Forgot password form */}
            <div className="flex flex-col justify-center p-12">
                <div className="w-full max-w-lg mx-auto">
                    {/* Header */}
                    <div className="space-y-2 text-center mb-8">
                        <h1 className="text-2xl font-bold bg-linear-to-r from-zinc-800 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent tracking-tighter">
                            Forgot your password?
                        </h1>
                        <p className="text-base text-zinc-500 dark:text-zinc-400 tracking-tighter">
                            No worries, we'll send you reset instructions
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Form inputs */}
                        <div className="space-y-4">
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
                                    type="email"
                                    placeholder="john.doe@example.com"
                                    className="h-12 bg-zinc-50 dark:bg-[#1a1a1a] border-zinc-200 dark:border-zinc-800/50"
                                />
                            </div>

                            {/* Submit button */}
                            <Button
                                className="w-full h-12 relative group overflow-hidden
                            bg-linear-to-r from-zinc-900 to-zinc-800 dark:from-white dark:to-zinc-200
                            text-white dark:text-[#121212] font-medium
                            shadow-lg shadow-zinc-200/20 dark:shadow-black/20
                            hover:from-orange-500 hover:to-orange-700 dark:hover:from-orange-400 dark:hover:to-orange-600
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-300"
                            >
                                <div className="relative flex items-center justify-center gap-2">
                                    <span className="font-medium tracking-tighter">
                                        Send reset instructions
                                    </span>
                                </div>
                            </Button>
                        </div>

                        {/* Back to login */}
                        <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 tracking-tighter">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-zinc-800 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-200
                        transition-colors underline underline-offset-4 decoration-zinc-200 dark:decoration-zinc-700
                        font-medium tracking-tighter"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to sign in
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
