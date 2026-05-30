import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const S3_REGION = process.env.WASABI_REGION || process.env.AWS_REGION || "us-east-1";
const S3_BUCKET = process.env.WASABI_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
const S3_ACCESS_KEY = process.env.WASABI_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const S3_SECRET_KEY = process.env.WASABI_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const S3_ENDPOINT = process.env.WASABI_ENDPOINT || process.env.AWS_ENDPOINT;

const s3Client = (S3_ACCESS_KEY && S3_SECRET_KEY)
  ? new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY
    },
    endpoint: S3_ENDPOINT,
    forcePathStyle: !!S3_ENDPOINT,
  })
  : null;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return new NextResponse("Missing key parameter", { status: 400 });
    }

    if (!s3Client || !S3_BUCKET) {
      return new NextResponse("S3 is not configured", { status: 500 });
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Convert S3 stream to Web ReadableStream
    // @ts-ignore
    const stream = response.Body.transformToWebStream();

    return new NextResponse(stream, {
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error fetching file from S3:", error);
    return new NextResponse("Internal Server Error or File Not Found", { status: 500 });
  }
}
