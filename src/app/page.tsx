import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

const featureCards = [
  ["Auth", "JWT + bcrypt"],
  ["Storage", "SQLite + Prisma"],
  ["Access", "Admin, Manager, User"],
] as const;

const roleCards = [
  ["Admin", "Manage users, roles, tasks, and audit visibility."],
  ["Manager", "Create, assign, and move team work through stages."],
  ["User", "Track assigned tasks and update progress clearly."],
] as const;

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="app-viewport min-h-screen px-5 py-7 text-slate-950 sm:px-8">
      <div className="app-grid-overlay" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="glass-card tilt-panel animate-entrance-rise rounded-[30px] px-7 py-6 animate-entrance-delay-1">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-sm uppercase tracking-[0.36em] text-sky-600">
                Assessment Build
              </p>
              <h1 className="mt-3 text-3xl font-semibold">
                Team Task Manager
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[20px] bg-gradient-to-br from-violet-500 via-sky-500 to-cyan-400 shadow-[0_18px_40px_rgba(59,130,246,0.24)]" />
              <div>
                <p className="text-lg font-semibold">Next.js + SQLite + JWT</p>
                <p className="text-sm text-slate-500">
                  Secure RBAC task workflow
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="glass-card tilt-panel animate-entrance-rise rounded-[36px] px-7 py-10 sm:px-10 lg:px-12 animate-entrance-delay-2">
          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 font-mono text-sm uppercase tracking-[0.28em] text-sky-700 depth-ring">
            Ship Mode
          </span>

          <div className="mt-8 max-w-5xl space-y-6">
            <h2 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Manage projects, tasks, and team status without leaving the
              browser.
            </h2>
            <p className="max-w-3xl text-lg leading-8 text-slate-600">
              Create an admin account, assign work to members, and track
              progress from a live dashboard that stays in sync with the
              backend.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {featureCards.map(([label, value]) => (
              <article
                key={label}
                className="glass-card tilt-panel rounded-[28px] px-6 py-5"
              >
                <p className="text-base text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-semibold">{value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-card tilt-panel animate-entrance-rise rounded-[36px] p-7 sm:p-8 animate-entrance-delay-3">
          <div className="grid rounded-[24px] bg-white/90 p-2 shadow-inner shadow-slate-200/70 sm:grid-cols-2 depth-ring">
            <a
              href="/register"
              className="inline-flex min-h-14 items-center justify-center rounded-[18px] bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-6 text-base font-semibold text-white shadow-[0_18px_50px_rgba(59,130,246,0.24)]"
            >
              Sign up
            </a>
            <a
              href="/login"
              className="inline-flex min-h-14 items-center justify-center rounded-[16px] px-6 text-base font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Log in
            </a>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {roleCards.map(([role, copy]) => (
              <article
                key={role}
                className="glass-card tilt-panel rounded-[24px] px-5 py-5"
              >
                <p className="text-xl font-semibold">{role}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
