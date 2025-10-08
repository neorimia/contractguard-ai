import { Geist } from "next/font/google";

const geist = Geist({
  weight: ["400", "600"],
  subsets: ["latin"],
});

interface PageHeroProps {
  title: string;
  highlightedText?: string;
  description: string;
  className?: string;
}

export default function PageHero({
  title,
  highlightedText,
  description,
  className = "",
}: PageHeroProps) {
  return (
    <section
      className={`py-20 sm:py-24 bg-black/95 dark:bg-white/95 mx-2 sm:mx-4 mt-1 mb-4 rounded-xl ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-6">
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white dark:text-black ${geist.className}`}
          >
            {title}{" "}
            {highlightedText && (
              <span className="bg-gradient-to-r from-white to-white/70 dark:from-black dark:to-black/70 bg-clip-text text-transparent">
                {highlightedText}
              </span>
            )}
          </h1>
          <p
            className={`text-lg sm:text-xl text-white/60 dark:text-black/60 max-w-3xl mx-auto ${geist.className}`}
          >
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
