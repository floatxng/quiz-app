import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import PlayClient from "./client";

export default async function PlayRoomPage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const room = await prisma.room.findUnique({
    where: { code },
    include: { quiz: { select: { title: true } } },
  });
  if (!room) notFound();
  const user = await getSessionUser();
  return <PlayClient code={code} userId={user?.id ?? null} quizTitle={room.quiz.title} />;
}
