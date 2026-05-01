import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Tally } from "@/components/Brand";
import LoginForm from "./form";

export default async function LoginPage() {
  const u = await getSessionUser();
  if (u) redirect(u.role === "ORGANIZER" ? "/dashboard" : "/me");
  return (
    <div className="mx-auto max-w-md rise">
      <div className="flex items-center gap-3 text-bone-dim">
        <Tally variant="off" />
        <span className="mono text-[0.65rem] uppercase tracking-[0.28em]">
          Вход
        </span>
      </div>
      <h1 className="h1 mt-5">
        С возвращением
        <span className="display-italic text-flare">.</span>
      </h1>
      <p className="lead mt-3 text-base">
        Войдите в свой аккаунт, чтобы продолжить.
      </p>

      <div className="mt-8">
        <LoginForm />
      </div>

      <p className="mt-6 text-sm text-bone-dim">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-flare hover:underline">
          Зарегистрироваться →
        </Link>
      </p>
    </div>
  );
}
