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
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        if (!allowedTypes.some(type => file.type.startsWith(type) || allowedTypes.includes(file.type))) {
            return NextResponse.json({ error: "Only image, audio, video, and document files are allowed." }, { status: 400 });
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
