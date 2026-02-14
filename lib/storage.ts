import "server-only";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

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
  const buffer = Buffer.from(await file.arrayBuffer() as ArrayBuffer);

  let processedBuffer: Buffer = buffer;
  let finalContentType = file.type;
  let extension = path.extname(file.name);

  // Compress images
  if (file.type.startsWith("image/") && !file.type.includes("svg")) {
    try {
      // Resize to max 1920x1080, convert to WebP, quality 80
      processedBuffer = await sharp(buffer as any)
        .rotate() // Auto-rotate based on EXIF
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toBuffer();

      finalContentType = "image/webp";
      extension = ".webp";
    } catch (error) {
      console.error("Image compression failed, using original:", error);
    }
  }

  const timestamp = Date.now();
  // Remove original extension and append new one
  const originalNameWithoutExt = path.basename(file.name, path.extname(file.name));
  const sanitizedName = originalNameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, "");
  const filename = `${timestamp}-${sanitizedName}${extension}`;
  const key = `${category}/${filename}`;

  // S3 Mode
  if (s3Client && S3_BUCKET) {
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: processedBuffer,
        ContentType: finalContentType,
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
  await writeFile(filepath, processedBuffer);

  return `/uploads/${category}/${filename}`;
}
