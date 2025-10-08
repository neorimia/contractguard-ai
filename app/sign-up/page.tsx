"use client";

import { SignUp } from "@stackframe/stack";
import Image from "next/image";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[3fr_2.5fr] bg-gray-50 dark:bg-black/30">
      {/* Left side - Image background with content */}
      <div className="relative flex flex-col items-center justify-center p-8">
        {/* Background Image */}
        <div className="absolute inset-4 z-0 rounded-xl overflow-hidden">
          <Image
            src="/auth-bg.webp"
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
            <Link href="/">
              <h1 className="text-4xl font-bold tracking-tighter cursor-pointer hover:opacity-90 transition-opacity">
                🛡️ ContractGuard AI
              </h1>
            </Link>
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

      {/* Right side - Stack Auth Sign Up */}
      <div className="flex flex-col justify-center p-12">
        <div className="w-full max-w-lg mx-auto">
          <SignUp
              automaticRedirect={true}
              firstTab='password'
              extraInfo={<>By signing up, you agree to our <a href="/terms">Terms</a></>}
          />
        </div>
      </div>
    </div>
  );
}
