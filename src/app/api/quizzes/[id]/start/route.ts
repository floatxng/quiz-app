import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { generateRoomCode } from "@/lib/roomCode";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url), { status: 303 });

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.id },
    include: { questions: true },
  });
  if (!quiz || quiz.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (quiz.questions.length === 0) {
    return NextResponse.redirect(new URL(`/dashboard/quiz/${quiz.id}?error=empty`, req.url), { status: 303 });
  }

  let code = "";
  for (let i = 0; i < 5; i++) {
    code = generateRoomCode();
    const exists = await prisma.room.findUnique({ where: { code } });
    if (!exists) break;
  }

  const room = await prisma.room.create({
    data: { code, quizId: quiz.id, hostId: user.id },
  });

  return NextResponse.redirect(new URL(`/host/${room.code}`, req.url), { status: 303 });
}
