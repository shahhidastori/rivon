import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";

type AllowedMimeTypes = Record<string, string>;

export const imageUploadMimeTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
} satisfies AllowedMimeTypes;

export const receiptUploadMimeTypes = {
  ...imageUploadMimeTypes,
  "application/pdf": "pdf"
} satisfies AllowedMimeTypes;

export function isAllowedUploadMime(allowedMimeTypes: AllowedMimeTypes, mimeType: string) {
  return Object.prototype.hasOwnProperty.call(allowedMimeTypes, mimeType);
}

export function safeUploadFilename(allowedMimeTypes: AllowedMimeTypes, mimeType: string, prefix: string) {
  const extension = allowedMimeTypes[mimeType];
  if (!extension) throw new Error("Unsupported upload type.");
  return `${prefix}-${Date.now()}-${randomUUID()}.${extension}`;
}

async function removeUploadedFile(filePath?: string) {
  if (!filePath) return;
  await fs.unlink(filePath).catch(() => undefined);
}

function hasValidMagicBytes(mimeType: string, bytes: Buffer) {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (mimeType === "image/webp") {
    return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  }

  if (mimeType === "image/gif") {
    const signature = bytes.toString("ascii", 0, 6);
    return signature === "GIF87a" || signature === "GIF89a";
  }

  if (mimeType === "application/pdf") {
    return bytes.length >= 5 && bytes.toString("ascii", 0, 5) === "%PDF-";
  }

  return false;
}

export async function assertSafeUploadedFile(
  file: Express.Multer.File | undefined,
  allowedMimeTypes: AllowedMimeTypes,
  label: string
) {
  if (!file) throw new Error(`${label} file is required.`);

  if (!isAllowedUploadMime(allowedMimeTypes, file.mimetype)) {
    await removeUploadedFile(file.path);
    throw new Error(`${label} file type is not allowed.`);
  }

  const bytes = await fs.readFile(file.path);
  if (!hasValidMagicBytes(file.mimetype, bytes)) {
    await removeUploadedFile(file.path);
    throw new Error(`${label} file content does not match the allowed file type.`);
  }
}
