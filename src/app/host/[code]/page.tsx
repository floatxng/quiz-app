import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import HostClient from "./client";

export default async function HostPage({ params }: { params: { code: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const room = await prisma.room.findUnique({
    where: { code: params.code.toUpperCase() },
    include: { quiz: { select: { title: true, _count: { select: { questions: true } } } } },
  });
  if (!room) notFound();
  if (room.hostId !== user.id) redirect("/dashboard");
  return (
    <HostClient
      code={room.code}
      userId={user.id}
      quizTitle={room.quiz.title}
      totalQuestions={room.quiz._count.questions}
    />
  );
}
