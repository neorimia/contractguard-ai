import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";
import { IMAGE_UPLOAD_CONSTANTS, isAcceptedImageType } from "@/lib/types/account-settings";

/**
 * POST /api/upload
 * Upload a file to CDN and return the URL
 * 
 * For MVP, we validate and return the file for client-side handling
 * Future: Integrate with CDN service (Cloudinary, AWS S3, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isAcceptedImageType(file.type)) {
      return NextResponse.json(
        { 
          error: "Invalid file type",
          message: `Please upload a valid image file (${IMAGE_UPLOAD_CONSTANTS.ACCEPTED_TYPES.join(", ")})`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > IMAGE_UPLOAD_CONSTANTS.MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: "File too large",
          message: `Image must be less than ${IMAGE_UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB}MB`
        },
        { status: 400 }
      );
    }

    // Convert to base64 for now (temporary solution until CDN integration)
    // Future: Upload to Cloudinary/S3 and return CDN URL
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      message: "File uploaded successfully"
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { 
        error: "Upload failed",
        message: "Failed to upload file. Please try again."
      },
      { status: 500 }
    );
  }
}

