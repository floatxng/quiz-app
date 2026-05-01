import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Tally } from "@/components/Brand";
import RegisterForm from "./form";

export default async function RegisterPage() {
  const u = await getSessionUser();
  if (u) redirect(u.role === "ORGANIZER" ? "/dashboard" : "/me");
  return (
    <div className="mx-auto max-w-md rise">
      <div className="flex items-center gap-3 text-bone-dim">
        <Tally variant="ready" />
        <span className="mono text-[0.65rem] uppercase tracking-[0.28em]">
          Регистрация
        </span>
      </div>
      <h1 className="h1 mt-5">
        Создайте аккаунт
        <span className="display-italic text-flare">.</span>
      </h1>
      <p className="lead mt-3 text-base">
        Выберите тип аккаунта — организатор со своими квизами или участник.
      </p>

      <div className="mt-8">
        <RegisterForm />
      </div>

      <p className="mt-6 text-sm text-bone-dim">
        Уже зарегистрированы?{" "}
        <Link href="/login" className="text-flare hover:underline">
          Войти →
        </Link>
      </p>
    </div>
  );
}
