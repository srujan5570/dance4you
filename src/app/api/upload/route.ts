import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { put } from "@vercel/blob";

// Node.js runtime route handler (not Edge)
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Invalid content type. Expected multipart/form-data." }, { status: 400 });
    }
    const form = await req.formData();
    // Support both single 'file' and multiple 'files'
    const files: File[] = [];
    const single = form.get("file");
    if (single && single instanceof File) {
      files.push(single);
    }
    const multi = form.getAll("files");
    for (const f of multi) {
      if (f instanceof File) files.push(f);
    }
    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided. Use 'file' or 'files' fields." }, { status: 400 });
    }

    const urls: string[] = [];
    const isProduction = process.env.NODE_ENV === "production";

    for (const f of files) {
      // Basic validation
      const mime = f.type || "";
      if (!mime.startsWith("image/")) {
        return NextResponse.json({ error: `Unsupported file type: ${mime}` }, { status: 400 });
      }
      const arrayBuffer = await f.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length > 10 * 1024 * 1024) { // 10MB limit
        return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
      }

      // Generate a safe filename
      const ext = (() => {
        const original = f.name.toLowerCase();
        const m = original.match(/\.([a-z0-9]+)$/);
        const e = m ? m[1] : (mime.split("/")[1] || "bin");
        // Only allow common image extensions
        if (["png","jpg","jpeg","gif","webp","svg"].includes(e)) return e;
        return "png";
      })();
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      const filename = `${id}.${ext}`;

      if (isProduction) {
        // Use Vercel Blob storage for production
        try {
          const blob = await put(filename, buffer, {
            access: "public",
            contentType: mime,
          });
          urls.push(blob.url);
        } catch (blobError) {
          console.error("Blob upload error:", blobError);
          return NextResponse.json({ error: "Failed to upload to cloud storage" }, { status: 500 });
        }
      } else {
        // Use local filesystem for development
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.promises.mkdir(uploadsDir, { recursive: true });
        const filepath = path.join(uploadsDir, filename);
        await fs.promises.writeFile(filepath, buffer);
        const urlPath = `/uploads/${filename}`;
        urls.push(urlPath);
      }
    }

    return NextResponse.json({ urls }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}