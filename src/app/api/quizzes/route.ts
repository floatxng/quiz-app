import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ORGANIZER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const title = String(body?.title || "").trim();
  const description = body?.description ? String(body.description).trim() : null;
  if (!title) return NextResponse.json({ error: "Введите название" }, { status: 400 });

  const quiz = await prisma.quiz.create({
    data: { title, description, ownerId: user.id },
  });
  return NextResponse.json({ id: quiz.id });
}
