import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getSessionUser } from "@/lib/auth";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ORGANIZER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Только PNG/JPEG/WEBP/GIF" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "До 5 МБ" }, { status: 400 });

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const name = crypto.randomBytes(8).toString("hex") + "." + ext;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);

  return NextResponse.json({ url: `/uploads/${name}` });
}
