import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionCookie, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const email = String(body.email || "").trim().toLowerCase();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const role = body.role === "ORGANIZER" ? "ORGANIZER" : "PARTICIPANT";

  if (!email || !username || password.length < 6) {
    return NextResponse.json({ error: "Заполните email, никнейм и пароль (мин. 6 символов)" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return NextResponse.json({ error: "Email или никнейм уже заняты" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, username, role, passwordHash: await hashPassword(password) },
  });

  const token = signToken({ uid: user.id, role: user.role as "ORGANIZER" | "PARTICIPANT" });
  setSessionCookie(token);
  return NextResponse.json({ ok: true, role: user.role });
}
