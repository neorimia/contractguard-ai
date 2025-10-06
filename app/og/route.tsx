import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title") || siteConfig.siteName;
    const description =
      searchParams.get("description") || siteConfig.siteDescription;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000000",
            backgroundImage:
              "linear-gradient(45deg, #1a1a1a 0%, #2d1b69 50%, #1a1a1a 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px",
              maxWidth: "1000px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: "#ffffff",
                marginBottom: "20px",
                background: "linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              🛡️ ContractGuard AI
            </div>
            <div
              style={{
                fontSize: "48px",
                fontWeight: "600",
                color: "#ffffff",
                marginBottom: "30px",
                lineHeight: "1.2",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: "28px",
                color: "#a1a1aa",
                lineHeight: "1.4",
                maxWidth: "800px",
              }}
            >
              {description}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "40px",
                padding: "20px 40px",
                backgroundColor: "rgba(139, 92, 246, 0.1)",
                border: "2px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "24px",
                  color: "#8b5cf6",
                  fontWeight: "600",
                }}
              >
                AI-Powered Smart Contract Security
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
