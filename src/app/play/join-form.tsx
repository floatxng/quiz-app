"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinForm({
  defaultNickname = "",
  defaultCode = "",
}: {
  defaultNickname?: string;
  defaultCode?: string;
}) {
  const [code, setCode] = useState(defaultCode.toUpperCase());
  const [nickname, setNickname] = useState(defaultNickname);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const n = nickname.trim();
    if (c.length < 4 || !n) {
      setError("Введите код и никнейм");
      return;
    }
    sessionStorage.setItem(`qa.nick.${c}`, n);
    router.push(`/play/${c}`);
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5">
      <div>
        <label className="label">Код комнаты</label>
        <input
          className="input input-mono mt-2 text-center text-2xl"
          maxLength={6}
          placeholder="ABCD42"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
          }
        />
        <div className="mono mt-2 text-[0.6rem] uppercase tracking-[0.22em] text-bone-faint">
          Шесть символов · только латиница и цифры
        </div>
      </div>
      <div>
        <label className="label">Никнейм</label>
        <input
          className="input mt-2"
          maxLength={24}
          placeholder="Как вас представить участникам"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>
      {error && (
        <div className="rounded-md border border-ember/40 bg-ember/10 px-3 py-2 text-sm text-ember">
          {error}
        </div>
      )}
      <button className="btn-primary w-full py-3">
        Войти в комнату
        <span aria-hidden>→</span>
      </button>
    </form>
  );
}
