import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadProfilePhoto(profileId: string, file: File) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${profileId}-${Date.now()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`profiles/${filename}`, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const uploadDir = path.join(process.cwd(), "public/uploads/profiles");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/profiles/${filename}`;
}
