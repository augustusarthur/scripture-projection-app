import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

const TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
};

const MAX_BYTES = 4 * 1024 * 1024;

function resolveContentType(file: File) {
  if (file.type && ALLOWED_TYPES.has(file.type)) {
    return file.type;
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return TYPE_BY_EXT[ext] ?? "";
}

export async function uploadProfilePhoto(profileId: string, file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("Photo must be under 4 MB.");
  }

  const contentType = resolveContentType(file);
  if (!contentType) {
    throw new Error("Please upload a JPEG, PNG, WebP, or GIF photo.");
  }

  const ext =
    file.name.split(".").pop()?.toLowerCase() ||
    EXT_BY_TYPE[contentType] ||
    "jpg";
  const pathname = `profiles/${profileId}-${Date.now()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });
    return blob.url;
  }

  const uploadDir = path.join(process.cwd(), "public/uploads/profiles");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${profileId}-${Date.now()}.${ext}`;
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/profiles/${filename}`;
}
