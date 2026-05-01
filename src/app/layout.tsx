import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Playfair_Display, Manrope, JetBrains_Mono } from "next/font/google";
import { getSessionUser } from "@/lib/auth";
import { Wordmark } from "@/components/Brand";
import { cn } from "@/lib/cn";

const display = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

const jbm = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuizArena · Живые квизы в реальном времени",
  description:
    "Создавайте квизы, подключайте участников по коду комнаты, играйте в реальном времени.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  return (
    <html
      lang="ru"
      className={cn(display.variable, manrope.variable, jbm.variable)}
    >
      <body className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-ink-700/70 bg-ink-900/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className="flex items-center group">
              <Wordmark />
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/play"
                className="btn-quiet hidden sm:inline-flex"
              >
                Подключиться
              </Link>
              {user ? (
                <>
                  {user.role === "ORGANIZER" && (
                    <Link href="/dashboard" className="btn-quiet">
                      Кабинет
                    </Link>
                  )}
                  <Link href="/me" className="btn-quiet">
                    {user.username}
                  </Link>
                  <form action="/api/auth/logout" method="post">
                    <button className="btn-quiet">Выйти</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-quiet">
                    Войти
                  </Link>
                  <Link href="/register" className="btn-quiet">
                    Регистрация
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">{children}</main>

        <footer className="mt-16 border-t border-ink-700/60">
          <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-bone-faint">
            <span className="mono uppercase tracking-[0.28em]">QuizArena</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
