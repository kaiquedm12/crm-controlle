"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LoginPanelProps = {
  loading: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
};

export function LoginPanel({ loading, onSubmit }: LoginPanelProps) {
  const [email, setEmail] = useState("admin@crm.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await onSubmit(email, password);
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Falha no login";
      setError(message);
    }
  }

  return (
    <section className="grid items-start gap-4 xl:min-h-[calc(100vh-6rem)] xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,380px)] xl:items-center">
      <div className="relative overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-800 via-blue-700 to-sky-600 p-6 text-blue-50 shadow-xl">
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-cyan-200/20 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/90">CRM CONTROLLE</p>
        <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight md:text-4xl xl:max-w-[14ch]">
          Pipeline comercial com cara de produto premium.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-blue-100/90 md:text-base xl:max-w-[34ch]">
          Gerencie leads no estilo Trello, acompanhe funil em tempo real e mova oportunidades entre
          etapas com drag-and-drop.
        </p>

        <div className="mt-6 hidden rounded-xl border border-white/25 bg-white/10 p-3 backdrop-blur-sm md:block">
          <div className="rounded-lg border border-blue-200/30 bg-slate-50/95 p-2.5 text-slate-800 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <div className="ml-1 h-5 w-32 rounded-full bg-slate-100" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md bg-white p-2 shadow-sm">
                <div className="mb-2 h-2.5 w-20 rounded bg-slate-200" />
                <div className="h-8 rounded bg-blue-50" />
              </div>
              <div className="rounded-md bg-white p-2 shadow-sm">
                <div className="mb-2 h-2.5 w-16 rounded bg-slate-200" />
                <div className="h-8 rounded bg-blue-50" />
              </div>
              <div className="rounded-md bg-white p-2 shadow-sm">
                <div className="mb-2 h-2.5 w-14 rounded bg-slate-200" />
                <div className="h-8 rounded bg-blue-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="w-full border-blue-100 bg-white/95 shadow-lg backdrop-blur xl:self-center">
        <CardHeader className="space-y-1.5 pb-2">
          <CardTitle className="text-xl text-slate-900">Acessar workspace</CardTitle>
          <CardDescription>Use suas credenciais para abrir o board.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm text-slate-600">
              Email
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-600">
              Senha
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </label>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Acessar board"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
