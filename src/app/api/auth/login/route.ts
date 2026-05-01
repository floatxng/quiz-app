import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSessionCookie, signToken, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) {
    return NextResponse.json({ error: "Введите email и пароль" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  const token = signToken({ uid: user.id, role: user.role as "ORGANIZER" | "PARTICIPANT" });
  setSessionCookie(token);
  return NextResponse.json({ ok: true, role: user.role });
}
