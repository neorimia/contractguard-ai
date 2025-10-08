import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4 bg-white dark:bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
          <Home className="w-12 h-12 text-black dark:text-white" />
        </div>

        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-black dark:text-white">
          404
        </h1>

        <div className="h-px w-32 bg-black/10 dark:bg-white/10" />
      </div>

      <div className="flex flex-col items-center gap-4 max-w-md">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-black dark:text-white text-center">
          Page Not Found
        </h2>
        <p className="text-sm sm:text-base tracking-tight text-black/60 dark:text-white/60 text-center">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <Link href="/">
        <Button
          size="lg"
          className="h-11 px-6 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 text-sm font-medium tracking-tight transition-all duration-300 group"
        >
          <span className="flex items-center gap-2">
            Back to Home
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Button>
      </Link>
    </div>
  );
}
