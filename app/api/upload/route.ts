import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const category = (formData.get("category") as string) || "others";

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Max size validation (e.g., 50MB for video/audio)
        const MAX_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "File size exceeds 50MB limit." }, { status: 400 });
        }

        // Validate type: support images, audio, video, and documents
        const allowedTypes = [
            "image/",
            "audio/",
            "video/",
            "application/pdf",
            "text/plain",
            "text/csv",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/zip",
            "application/x-zip-compressed",
            "application/x-rar-compressed",
            "application/octet-stream"
        ];
        const allowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".zip", ".rar"];
        const fileExt = file.name ? file.name.substring(file.name.lastIndexOf(".")).toLowerCase() : "";

        if (!allowedTypes.some(type => file.type.startsWith(type) || allowedTypes.includes(file.type)) && !allowedExtensions.includes(fileExt)) {
            return NextResponse.json({ error: "Only image, audio, video, and valid document/archive files are allowed." }, { status: 400 });
        }


        // Sanitize category to prevent directory traversal (allowing slashes for subdirectories)
        const sanitizedCategory = category.replace(/[^a-zA-Z0-9_\-\/]/g, "");

        // Create unique filename and upload
        const fileUrl = await uploadFile(file, sanitizedCategory);

        return NextResponse.json({
            success: true,
            url: fileUrl,
            size: file.size,
            type: file.type
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }
}
