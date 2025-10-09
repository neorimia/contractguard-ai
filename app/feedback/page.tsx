"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";
import { Header } from "@/components/Header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle } from "lucide-react";
import { Geist } from "next/font/google";
const geist = Geist({
  weight: ["400", "600"],
  subsets: ["latin"],
});
function FeedbackForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useUser();
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const reasonParam = searchParams.get("reason");
    if (reasonParam) {
      setReason(reasonParam);
    }
  }, [searchParams]);

  const getTitle = () => {
    switch (reason) {
      case "cancellation":
        return "We're Sorry to See You Go";
      case "feature":
        return "Help Us Improve";
      case "bug":
        return "Report an Issue";
      default:
        return "Share Your Feedback";
    }
  };

  const getDescription = () => {
    switch (reason) {
      case "cancellation":
        return "Your feedback helps us improve ContractGuard AI. Please let us know why you cancelled your subscription.";
      case "feature":
        return "We'd love to hear your ideas for new features or improvements.";
      case "bug":
        return "Help us fix issues by describing what went wrong.";
      default:
        return "We value your input and would love to hear from you.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          feedback,
          rating,
          userEmail: user?.primaryEmail || undefined,
          userId: user?.id || undefined,
          timestamp: new Date().toISOString(),
        }),
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center space-y-6 max-w-lg">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h2 className="text-3xl font-semibold text-black dark:text-white">
            Thank You for Your Feedback!
          </h2>
          <p className="text-black/60 dark:text-white/60">
            Your input is valuable and helps us improve ContractGuard AI for
            everyone.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button
              onClick={() => router.push("/")}
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-semibold text-black dark:text-white">
            {getTitle()}
          </h1>
          <p className="text-black/60 dark:text-white/60">{getDescription()}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-black dark:text-white">
              How would you rate your experience? (Optional)
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-4xl transition-all ${
                    rating && star <= rating
                      ? "text-yellow-500"
                      : "text-black/20 dark:text-white/20 hover:text-yellow-500/50"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Cancellation Reasons (if applicable) */}
          {reason === "cancellation" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-black dark:text-white">
                What was the main reason for cancelling?
              </label>
              <div className="space-y-2">
                {[
                  "Too expensive",
                  "Not enough scans per day",
                  "Missing features I need",
                  "Found a better alternative",
                  "Technical issues",
                  "No longer need it",
                  "Other",
                ].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 p-3 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="cancellation-reason"
                      value={option}
                      onChange={(e) => {
                        if (feedback.includes("Reason:")) {
                          const parts = feedback.split(
                            "\n\nAdditional comments:",
                          );
                          setFeedback(
                            `Reason: ${e.target.value}${parts[1] ? "\n\nAdditional comments:" + parts[1] : ""}`,
                          );
                        } else {
                          setFeedback(
                            `Reason: ${e.target.value}\n\n${feedback}`,
                          );
                        }
                      }}
                      className="w-4 h-4 text-black dark:text-white"
                    />
                    <span className="text-black/80 dark:text-white/80">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Text */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-black dark:text-white">
              {reason === "cancellation"
                ? "Additional comments (Optional)"
                : "Your Feedback"}
            </label>
            <textarea
              value={
                reason === "cancellation"
                  ? feedback.split("\n\nAdditional comments:")[1] || ""
                  : feedback
              }
              onChange={(e) => {
                if (reason === "cancellation") {
                  const reasonText = feedback.split(
                    "\n\nAdditional comments:",
                  )[0];
                  setFeedback(
                    reasonText
                      ? `${reasonText}\n\nAdditional comments: ${e.target.value}`
                      : e.target.value,
                  );
                } else {
                  setFeedback(e.target.value);
                }
              }}
              rows={6}
              placeholder={
                reason === "cancellation"
                  ? "Tell us more about your decision..."
                  : "Share your thoughts with us..."
              }
              className="w-full px-4 py-3 bg-transparent border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all resize-none"
              required={reason !== "cancellation"}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || (!feedback && reason !== "cancellation")}
            className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                Submit Feedback
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <main
      className={`relative min-h-screen w-full bg-white dark:bg-black ${geist.className} overflow-hidden`}
    >
      <div className="relative bg-white/95 dark:bg-black/5 pt-14">
        <Header />

        <section className="min-h-[calc(100vh-5.5rem)] py-12">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white" />
              </div>
            }
          >
            <FeedbackForm />
          </Suspense>
        </section>

        <Footer />
      </div>
    </main>
  );
}
