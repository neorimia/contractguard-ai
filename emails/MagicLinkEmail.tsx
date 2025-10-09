import { type } from "arktype";
import { Section, Hr, Img, Link } from "@react-email/components";
import { Subject, NotificationCategory, Props } from "@stackframe/emails";

export const variablesSchema = type({
  magicLink: "string",
  otp: "string",
});

export function EmailTemplate({
  user,
  project,
  variables,
}: Props<typeof variablesSchema.infer>) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://contractguard.ai";

  return (
    <>
      <Subject
        value={
          "Sign in to " +
          project.displayName +
          ": Your code is " +
          variables.otp
        }
      />
      <NotificationCategory value="Transactional" />
      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
          backgroundColor: "#fafafa",
          margin: 0,
          padding: "40px 0",
          width: "100%",
          minHeight: "100vh",
        }}
      >
        <Section
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#000000",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            overflow: "hidden",
          }}
        >
          {/* Header with Logo */}
          <div
            style={{
              padding: "40px 30px 32px",
              textAlign: "center",
              background:
                "linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: "1px",
                background:
                  "linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent)",
              }}
            />
            <Img
              src={`${siteUrl}/icon.svg`}
              alt="ContractGuard AI"
              width="48"
              height="48"
              style={{
                display: "block",
                margin: "0 auto 20px",
                width: "48px",
                height: "48px",
              }}
            />
            <h3
              style={{
                margin: 0,
                fontSize: "28px",
                fontWeight: 700,
                background:
                  "linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0.7))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              🔐 Sign in to {project.displayName}
            </h3>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "1px",
                background:
                  "linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent)",
              }}
            />
          </div>

          {/* Content */}
          <div style={{ padding: "40px 30px" }}>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
                color: "rgba(255, 255, 255, 0.8)",
                margin: "0 0 32px",
                textAlign: "center",
              }}
            >
              Hi{user.displayName ? ", " + user.displayName : ""}! This is your
              one-time password for signing in:
            </p>

            {/* OTP Box */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                padding: "32px 24px",
                margin: "24px 0",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "rgba(255, 255, 255, 0.6)",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Your Code
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "40px",
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "8px",
                  fontFamily: "Monaco, Courier, monospace",
                }}
              >
                {variables.otp}
              </p>
            </div>

            <Hr
              style={{
                border: "none",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                margin: "32px 0",
              }}
            />

            <p
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
                color: "rgba(255, 255, 255, 0.8)",
                margin: "0 0 20px",
                textAlign: "center",
              }}
            >
              Or you can click on this link to sign in directly:
            </p>

            {/* Magic Link Button */}
            <div style={{ textAlign: "center", margin: "32px 0" }}>
              <Link
                href={variables.magicLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "16px 32px",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "16px",
                  letterSpacing: "0.5px",
                }}
              >
                SIGN IN WITH MAGIC LINK
              </Link>
            </div>

            <Hr
              style={{
                border: "none",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                margin: "32px 0",
              }}
            />

            <p
              style={{
                fontSize: "14px",
                lineHeight: "1.6",
                color: "rgba(255, 255, 255, 0.5)",
                margin: 0,
                textAlign: "center",
              }}
            >
              If you were not expecting this email, you can safely ignore it.
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "30px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              textAlign: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <p
              style={{
                margin: "8px 0",
                fontSize: "14px",
                fontWeight: 600,
                color: "#ffffff",
              }}
            >
              {project.displayName}
            </p>
            <p
              style={{
                margin: "8px 0",
                fontSize: "13px",
                color: "rgba(255, 255, 255, 0.6)",
              }}
            >
              AI-Powered Smart Contract Security Scanner
            </p>
          </div>
        </Section>
      </div>
    </>
  );
}

EmailTemplate.PreviewVariables = {
  magicLink: "<magic link>",
  otp: "3SLSWZ",
} satisfies typeof variablesSchema.infer;
