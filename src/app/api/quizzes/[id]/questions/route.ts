import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

type IncomingOption = { text: string; isCorrect: boolean };
type IncomingQuestion = {
  text: string;
  imageUrl: string | null;
  type: "single" | "multiple";
  timeLimit: number;
  points: number;
  options: IncomingOption[];
};

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quiz = await prisma.quiz.findUnique({ where: { id: params.id } });
  if (!quiz || quiz.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { questions?: IncomingQuestion[] } | null;
  if (!body?.questions) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  for (const q of body.questions) {
    if (!q.text?.trim()) {
      return NextResponse.json({ error: "Каждый вопрос должен иметь текст" }, { status: 400 });
    }
    if (!q.options.length || q.options.length < 2) {
      return NextResponse.json({ error: "Минимум 2 варианта на вопрос" }, { status: 400 });
    }
    if (!q.options.some((o) => o.isCorrect)) {
      return NextResponse.json({ error: "В каждом вопросе должен быть правильный вариант" }, { status: 400 });
    }
  }

  await prisma.$transaction([
    prisma.question.deleteMany({ where: { quizId: quiz.id } }),
    ...body.questions.map((q, i) =>
      prisma.question.create({
        data: {
          quizId: quiz.id,
          position: i,
          text: q.text.trim(),
          imageUrl: q.imageUrl || null,
          type: q.type === "multiple" ? "multiple" : "single",
          timeLimit: Math.max(5, Math.min(120, Number(q.timeLimit) || 20)),
          points: Math.max(100, Number(q.points) || 1000),
          options: {
            create: q.options.map((o, j) => ({
              text: String(o.text || "").trim(),
              isCorrect: !!o.isCorrect,
              position: j,
            })),
          },
        },
      })
    ),
  ]);

  return NextResponse.json({ ok: true });
}
