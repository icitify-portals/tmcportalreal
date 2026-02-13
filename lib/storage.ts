import "server-only";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// robust checking for ENV variables
const S3_REGION = process.env.AWS_REGION || "us-east-1";
const S3_BUCKET = process.env.AWS_BUCKET_NAME;
const S3_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const S3_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_ENDPOINT = process.env.AWS_ENDPOINT; // Optional for R2/MinIO

const s3Client = (S3_ACCESS_KEY && S3_SECRET_KEY)
  ? new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY
    },
    endpoint: S3_ENDPOINT, // Custom endpoint support
    forcePathStyle: !!S3_ENDPOINT, // Needed for MinIO/some S3 compatible
  })
  : null;

export async function uploadFile(file: File, category: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
  const filename = `${timestamp}-${sanitizedName}`;
  const key = `${category}/${filename}`;

  // S3 Mode
  if (s3Client && S3_BUCKET) {
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        ACL: 'public-read' // Only if bucket allows. Or rely on bucket policy.
      }));

      // If endpoint is custom (e.g. R2), construct URL differently
      if (S3_ENDPOINT) {
        // R2/Custom URL logic usually: https://bucket.endpoint/key or https://endpoint/bucket/key
        // Simplest: https://{bucket}.{endpoint-domain}/{key} 
        // For now, return standard S3 URL
        return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
      }

      // Standard S3 URL
      return `https://${S3_BUCKET}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error("S3 Upload Error:", error);
      throw new Error("Failed to upload to cloud storage");
    }
  }

  // Local Fallback
  const uploadDir = path.join(process.cwd(), "public/uploads", category);
  try {
    const { mkdir } = await import("fs/promises");
    await mkdir(uploadDir, { recursive: true });
  } catch (e) {
    // Ignore if exists
  }

  const filepath = path.join(uploadDir, filename);
  const { writeFile } = await import("fs/promises");
  await writeFile(filepath, buffer);

  return `/uploads/${category}/${filename}`;
}
