// app/handler/email-verification/page.tsx
import { AuthService } from "@/lib/services/auth.service";
import { VerificationSuccess } from "@/components/auth/VerificationSuccess";
import { VerificationError } from "@/components/auth/VerificationError";

interface PageProps {
  searchParams: Promise<{
    code?: string;
  }>;
}

function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    TOKEN_NOT_FOUND:
      "This verification link is invalid or has already been used.",
    TOKEN_EXPIRED:
      "This verification link has expired. Please request a new one.",
    TOKEN_ALREADY_USED:
      "This email has already been verified. You can log in now.",
    INVALID_FORMAT: "The verification link format is invalid.",
  };
  return messages[error] || "Verification failed. Please try again.";
}

export default async function EmailVerificationHandler({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const { code } = params;

  // Missing code parameter
  if (!code) {
    return (
      <VerificationError
        error="MISSING_CODE"
        message="Verification link is invalid. Please check your email for the correct link."
      />
    );
  }

  const authService = new AuthService();

  try {
    // Validate and verify token
    const result = await authService.verifyEmail(code);

    if (result.success) {
      return (
        <VerificationSuccess
          email={result.email!}
          redirectUrl="/chat"
          redirectDelay={3000}
        />
      );
    } else {
      return (
        <VerificationError
          error={result.error!}
          message={getErrorMessage(result.error!)}
          showResendButton={result.error === "TOKEN_EXPIRED"}
          email={result.email}
        />
      );
    }
  } catch (error) {
    console.error("Email verification error:", error);
    return (
      <VerificationError
        error="SERVER_ERROR"
        message="An unexpected error occurred. Please try again or contact support."
      />
    );
  }
}
