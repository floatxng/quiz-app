import { getSessionUser } from "@/lib/auth";
import { Tally } from "@/components/Brand";
import JoinForm from "./join-form";

export default async function PlayPage({
  searchParams,
}: {
  searchParams?: { code?: string };
}) {
  const user = await getSessionUser();
  return (
    <div className="mx-auto max-w-md rise">
      <div className="flex items-center gap-3 text-bone-dim">
        <Tally variant="ready" label="Подключение" />
      </div>
      <h1 className="h1 mt-5">
        Войти в комнату
        <span className="display-italic text-flare">.</span>
      </h1>
      <p className="lead mt-3 text-base">
        Введите шестизначный код от организатора и никнейм.
      </p>
      <div className="mt-8">
        <JoinForm
          defaultNickname={user?.username || ""}
          defaultCode={searchParams?.code || ""}
        />
      </div>
    </div>
  );
}
