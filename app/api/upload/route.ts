import { put } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

// Configuration
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "mp4", "webm", "mov"];

/**
 * Validates file extension against allowed extensions
 */
function isValidExtension(filename: string): boolean {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension ? ALLOWED_EXTENSIONS.includes(extension) : false;
}

/**
 * Validates MIME type against allowed types
 */
function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validates file size
 */
function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * POST /api/upload - Handles file uploads for posts
 * 
 * Accepts FormData with 'file' field
 * Returns { url, filename, size, type } on success
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting could be added here (e.g., check user ID from auth)
    
    const formData = await request.formData();
    const file = formData.get("file");

    // Validate file presence
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { 
          error: "No file provided",
          code: "MISSING_FILE" 
        },
        { status: 400 }
      );
    }

    // Validate file name is not empty
    if (!file.name || file.name.trim().length === 0) {
      return NextResponse.json(
        { 
          error: "Invalid file name",
          code: "INVALID_FILENAME" 
        },
        { status: 400 }
      );
    }

    // Validate file extension
    if (!isValidExtension(file.name)) {
      return NextResponse.json(
        { 
          error: "Invalid file extension. Allowed: jpg, jpeg, png, gif, webp, mp4, webm, mov",
          code: "INVALID_EXTENSION" 
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!isValidMimeType(file.type)) {
      return NextResponse.json(
        { 
          error: "Invalid file type. Only images and videos are allowed.",
          code: "INVALID_MIME_TYPE" 
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      if (file.size === 0) {
        return NextResponse.json(
          { 
            error: "File is empty",
            code: "EMPTY_FILE" 
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { 
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          code: "FILE_TOO_LARGE" 
        },
        { status: 400 }
      );
    }

    // Generate secure filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split(".").pop()?.toLowerCase();
    const sanitizedName = file.name
      .split(".")[0]
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase();
    const filename = `uploads/${timestamp}-${randomId}-${sanitizedName}.${extension}`;

    // Upload to Vercel Blob with security options
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
      cacheControlMaxAge: 60 * 60 * 24 * 365, // 1 year cache for immutable files
    });

    return NextResponse.json(
      {
        url: blob.url,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("[v0] Upload error:", error);
    
    // Distinguish between different error types
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized") || error.message.includes("403")) {
        return NextResponse.json(
          { 
            error: "Upload service authorization failed",
            code: "UPLOAD_UNAUTHORIZED" 
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: "Upload failed. Please try again.",
        code: "UPLOAD_FAILED" 
      },
      { status: 500 }
    );
  }
}
