import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { Tally, Crosshair } from "@/components/Brand";

export default async function HomePage() {
  const user = await getSessionUser();

  const primaryHref = user
    ? user.role === "ORGANIZER"
      ? "/dashboard"
      : "/play"
    : "/register";
  const primaryLabel = user
    ? user.role === "ORGANIZER"
      ? "В кабинет"
      : "Подключиться к квизу"
    : "Зарегистрироваться";

  return (
    <div className="space-y-20">
      <section className="grid gap-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7 rise">
          <h1 className="display text-[clamp(3rem,8vw,6.5rem)] font-semibold">
            Живые квизы.
            <br />
            <span className="display-italic font-light text-flare">
              В реальном времени.
            </span>
          </h1>

          <p className="lead mt-7 max-w-lg">
            Соберите вопросы, запустите комнату и пригласите участников по
            шестизначному коду. Все отвечают синхронно, очки начисляются
            мгновенно.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href={primaryHref} className="btn-primary px-5 py-3 text-base">
              {primaryLabel}
              <span aria-hidden>→</span>
            </Link>
            <Link href="/play" className="btn-ghost px-5 py-3 text-base">
              Сыграть по коду
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 rise">
          <FauxStudio />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3 rise">
        <Feature
          n="01"
          title="Соберите квиз"
          body="Вопросы с одиночным или множественным выбором. Картинки. Время и баллы — на каждый вопрос отдельно."
        />
        <Feature
          n="02"
          title="Запустите комнату"
          body="Шестизначный код для участников, лобби с никами и кнопка «Старт». Вы видите все ответы в реальном времени."
        />
        <Feature
          n="03"
          title="Покажите результат"
          body="Лидерборд после каждого вопроса, финальный список победителей и история всех игр в личном кабинете."
        />
      </section>

      <section className="card-flat p-8">
        <div className="eyebrow">Как это работает</div>
        <h2 className="h2 mt-3">
          Создал — запустил —
          <br />
          <span className="display-italic text-bone-dim">
            поделился кодом.
          </span>
        </h2>
        <ol className="mt-6 grid gap-4 text-bone-dim md:grid-cols-2">
          {[
            "Войдите как организатор и создайте квиз.",
            "Запустите комнату — поделитесь шестизначным кодом.",
            "Каждый вопрос идёт всем участникам синхронно.",
            "После каждого вопроса показываем лидерборд.",
          ].map((s, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="mono mt-0.5 w-6 shrink-0 text-flare">
                0{i + 1}
              </span>
              <span className="text-bone">{s}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Feature({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="card group">
      <div className="flex items-center justify-between">
        <span className="mono text-flare text-[0.7rem] tracking-[0.32em]">
          № {n}
        </span>
        <Crosshair className="text-bone-faint transition-colors group-hover:text-flare" />
      </div>
      <h3 className="display mt-5 text-2xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-bone-dim">{body}</p>
    </div>
  );
}

function FauxStudio() {
  return (
    <div className="stage relative">
      <div className="relative px-6 py-7">
        <div className="flex items-center justify-between">
          <Tally variant="live" label="Live" />
          <span className="pill mono">QZ7K42</span>
        </div>

        <div className="mt-6">
          <div className="mono text-[0.65rem] uppercase tracking-[0.28em] text-bone-faint">
            Вопрос 03 / 10 · Осталось 12 с
          </div>
          <div className="display mt-3 text-[1.65rem] leading-tight">
            Какой протокол использует Socket.IO для двусторонней связи?
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {[
            { l: "A", t: "WebSocket", correct: true },
            { l: "B", t: "HTTP/2" },
            { l: "C", t: "gRPC" },
            { l: "D", t: "MQTT" },
          ].map((o) => (
            <div
              key={o.l}
              className={
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition " +
                (o.correct
                  ? "border-flare bg-flare/12 glow-amber"
                  : "border-ink-700 bg-ink-800/70")
              }
            >
              <span className="display-italic text-xl leading-none text-bone-dim">
                {o.l}.
              </span>
              <span className="text-sm text-bone">{o.t}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-ink-700/70">
          <div
            className="h-full bg-gradient-to-r from-flare to-ember"
            style={{ width: "62%" }}
          />
        </div>

        <div className="mt-5 flex items-center justify-between text-xs">
          <div className="flex items-baseline gap-2 text-bone-dim">
            <span className="mono uppercase tracking-[0.22em] text-bone-faint">
              Лидер
            </span>
            <span className="text-bone">Alex</span>
            <span className="mono text-flare">2 850</span>
          </div>
          <div className="mono text-bone-faint">12 / 14 ответили</div>
        </div>
      </div>
    </div>
  );
}

