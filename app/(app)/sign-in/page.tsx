"use client";

import { SignIn } from "@stackframe/stack";
import Image from "next/image";
import { CustomMagicLinkSignIn } from "@/components/auth/CustomMagicLinkSignIn";

export default function LoginPage() {
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
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjZ3JhZGllbnQwX2xpbmVhcl8xXzEpIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50MF9saW5lYXJfMV8xIiB4MT0iMCIgeTE9IjAiIHgyPSIxMDAiIHkyPSIxMDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iIzAwMDAwMCIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMxMTExMTEiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K";
            }}
          />
        </div>

        {/* Content overlay */}
        <div className="relative z-10 text-center text-white space-y-6 max-w-md">
          {/* Main Title */}
          {/*<h2 className="text-3xl font-semibold leading-tight tracking-tighter">*/}
          {/*  Secure your crypto investments with AI-powered contract analysis.*/}
          {/*</h2>*/}

          {/* Subtitle */}
          {/*<p className="text-lg text-gray-200 leading-relaxed tracking-tighter">*/}
          {/*  Detect scams, honeypots, and rug pulls in seconds. Join 1000+*/}
          {/*  traders protecting their investments.*/}
          {/*</p>*/}
        </div>
      </div>

      {/* Right side - Custom Magic Link Sign In */}
      <div className="flex flex-col justify-center items-center p-12">
        <CustomMagicLinkSignIn />
      </div>
    </div>
  );
}
