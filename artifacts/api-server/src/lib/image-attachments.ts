import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Request } from "express";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_IMAGE_BYTES + 128 * 1024;
const IMAGE_EXTENSIONS = new Map<string, { mediaType: "image/jpeg" | "image/png"; extension: "jpg" | "jpeg" | "png" }>([
  [".jpg", { mediaType: "image/jpeg", extension: "jpg" }],
  [".jpeg", { mediaType: "image/jpeg", extension: "jpeg" }],
  [".png", { mediaType: "image/png", extension: "png" }],
] as const);

export class ImageUploadError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 413 = 400,
  ) {
    super(message);
    this.name = "ImageUploadError";
  }
}

type ParsedImage = {
  originalFilename: string;
  mediaType: "image/jpeg" | "image/png";
  size: number;
  data: Buffer;
  extension: "jpg" | "jpeg" | "png";
};

function uploadDirectory(): string {
  return path.resolve(process.env.KAMALO_UPLOAD_DIR || path.join(process.cwd(), "data", "kamalo-attachments"));
}

function imageSignatureMatches(data: Buffer, mediaType: ParsedImage["mediaType"]): boolean {
  if (mediaType === "image/png") {
    return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
}

async function readRequestBody(req: Request): Promise<Buffer> {
  const declaredLength = Number(req.headers["content-length"] || 0);
  if (declaredLength > MAX_MULTIPART_BYTES) {
    throw new ImageUploadError("The image is too large. Choose an image smaller than 5 MB.", 413);
  }

  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += value.length;
    if (total > MAX_MULTIPART_BYTES) {
      throw new ImageUploadError("The image is too large. Choose an image smaller than 5 MB.", 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

async function parseMultipartImage(req: Request): Promise<ParsedImage> {
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = /^multipart\/form-data;\s*boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!boundaryMatch) throw new ImageUploadError("Choose a JPG or PNG image to attach.");

  const body = await readRequestBody(req);
  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const start = body.indexOf(boundary);
  if (start < 0) throw new ImageUploadError("The image upload could not be read.");

  const headerStart = start + boundary.length + 2;
  const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"), headerStart);
  if (headerEnd < 0) throw new ImageUploadError("The image upload could not be read.");
  const headers = body.subarray(headerStart, headerEnd).toString("utf8");
  const disposition = /content-disposition:\s*form-data;[^\r\n]*name="([^"]+)"[^\r\n]*filename="([^"]*)"/i.exec(headers);
  if (!disposition || disposition[1] !== "file" || !disposition[2]) {
    throw new ImageUploadError("Choose a JPG or PNG image to attach.");
  }

  const dataStart = headerEnd + 4;
  const dataEnd = body.indexOf(Buffer.from(`\r\n${boundary}`), dataStart);
  if (dataEnd <= dataStart) throw new ImageUploadError("The image upload could not be read.");
  const data = body.subarray(dataStart, dataEnd);
  if (data.length === 0) throw new ImageUploadError("The selected image is empty.");
  if (data.length > MAX_IMAGE_BYTES) {
    throw new ImageUploadError("The image is too large. Choose an image smaller than 5 MB.", 413);
  }

  const originalFilename = path.basename(disposition[2].replaceAll("\\", "/")).slice(0, 255);
  const extension = path.extname(originalFilename).toLowerCase();
  const allowed = IMAGE_EXTENSIONS.get(extension);
  const partContentType = /^content-type:\s*([^\r\n]+)/im.exec(headers)?.[1]?.trim().toLowerCase();
  if (!allowed || partContentType !== allowed.mediaType || !imageSignatureMatches(data, allowed.mediaType)) {
    throw new ImageUploadError("Only valid JPG or PNG images can be attached.");
  }

  return {
    originalFilename,
    mediaType: allowed.mediaType,
    size: data.length,
    data,
    extension: allowed.extension,
  };
}

export async function saveConversationImage(req: Request, id: string): Promise<{
  originalFilename: string;
  mediaType: "image/jpeg" | "image/png";
  size: number;
  storageKey: string;
}> {
  const image = await parseMultipartImage(req);
  const storageKey = `${id}.${image.extension}`;
  await mkdir(uploadDirectory(), { recursive: true });
  await writeFile(path.join(uploadDirectory(), storageKey), image.data, { flag: "wx" });
  return {
    originalFilename: image.originalFilename,
    mediaType: image.mediaType,
    size: image.size,
    storageKey,
  };
}

export async function readConversationImage(storageKey: string): Promise<Buffer> {
  if (!/^[a-z0-9-]+\.(?:jpg|jpeg|png)$/.test(storageKey)) {
    throw new Error("Invalid attachment storage key");
  }
  return readFile(path.join(uploadDirectory(), storageKey));
}