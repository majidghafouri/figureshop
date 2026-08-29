import { NextRequest } from "next/server";
import { ok, fail, requireAdmin } from "@/lib/api";
import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

export const runtime = "nodejs";

const ALLOWED_IMAGE = /^image\/(png|jpe?g|webp|gif|avif)$/;
const ALLOWED_AUDIO = /^audio\/(mpeg|mp3|ogg|wav|m4a|aac|webm)$/;
const MAX_SIZE = 25 * 1024 * 1024;
const CURSOR_MAX = 32;

/**
 * Verify that a buffer actually contains a known audio format by inspecting
 * its "magic bytes"/signature rather than trusting the client-supplied MIME.
 * Returns true when the content matches a recognized audio container so a
 * forged audio/* MIME cannot smuggle arbitrary binary content.
 */
function isRealAudio(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 12).toString("latin1");
  if (head.startsWith("ID3") || head.startsWith("OggS") || head.startsWith("RIFF") || head.startsWith("fLaC")) {
    return true;
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return true; // MPEG sync frame (mp3)
  }
  if (head.startsWith("ftyp")) {
    return head.includes("M4A") || head.includes("mp42") || head.includes("isom") || head.includes("M4V");
  }
  return false;
}

async function prepareCursor(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(CURSOR_MAX, CURSOR_MAX, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function toWebP(buffer: Buffer): Promise<Buffer | null> {
  try {
    const meta = await sharp(buffer, { animated: true }).metadata();
    const animated = (meta.pages ?? 0) > 1;
    return await sharp(buffer, { animated, failOn: "none" })
      .webp({ quality: 82, effort: 4, loop: animated ? 0 : undefined })
      .toBuffer();
  } catch {
    return null;
  }
}

function extFrom(name: string, mime: string, isConvertedWebP: boolean) {
  if (isConvertedWebP) return ".webp";
  const e = path.extname(name).toLowerCase();
  if (e && (e === ".jpg" || e === ".jpeg" || e === ".png" || e === ".webp" || e === ".gif" || e === ".avif" || e === ".mp3" || e === ".ogg" || e === ".wav" || e === ".m4a" || e === ".aac" || e === ".webm")) {
    return e;
  }
  return mime.startsWith("audio/") ? ".mp3" : ".jpg";
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const form = await req.formData();
    const isFileLike = (v: FormDataEntryValue): v is File =>
      typeof v === "object" &&
      "arrayBuffer" in v &&
      "name" in v &&
      "type" in v &&
      "size" in v;
    const files = Array.from(form.values()).filter(isFileLike);
    if (files.length === 0) return fail("no_file");

    const isCursor = form.get("kind") === "cursor";

    const urls: string[] = [];
    for (const file of files) {
      if (file.size > MAX_SIZE) return fail("file_too_large");
      const isImage = ALLOWED_IMAGE.test(file.type);
      const isAudio = ALLOWED_AUDIO.test(file.type);
      if (!isImage && !isAudio) return fail("unsupported_type");

      let buffer: Buffer = Buffer.from(await file.arrayBuffer());
      const kind = isAudio ? "audio" : isCursor ? "cur" : "img";

      if (isAudio && !isRealAudio(buffer)) {
        return fail("invalid_audio");
      }

      let convertedToWebP = false;
      if (isImage && !isCursor) {
        const meta = await sharp(buffer, { animated: true }).metadata().catch(() => null);
        if (!meta || !meta.format) return fail("invalid_image");
        const webp = await toWebP(buffer);
        if (webp) {
          buffer = webp;
          convertedToWebP = true;
        }
      }
      if (isCursor && isImage) {
        const meta = await sharp(buffer).metadata().catch(() => null);
        if (!meta || !meta.format) return fail("invalid_image");
        buffer = await prepareCursor(buffer);
      }

      const name = `${kind}-${Date.now()}-${crypto.randomBytes(5).toString("hex")}${isCursor && isImage ? ".png" : extFrom(file.name, file.type, convertedToWebP)}`;
      const pathname = `uploads/${name}`;

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(pathname, buffer, {
          access: "public",
          addRandomSuffix: false,
        });
        urls.push(blob.url);
      } else {
        const dir = path.join(process.cwd(), "public", "uploads");
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, name), buffer);
        urls.push(`/uploads/${name}`);
      }
    }

    return ok({ urls });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "upload_failed", 500);
  }
}
