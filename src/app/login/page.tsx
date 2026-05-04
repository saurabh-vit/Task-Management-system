import { redirect } from "next/navigation";

import { loginUser } from "@/app/auth-actions";
import { pickSearchParam } from "@/lib/action-utils";
import { getSession } from "@/lib/auth/session";

interface LoginPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const inputClassName =
  "min-h-14 w-full rounded-[20px] border border-slate-200 bg-white px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const next = pickSearchParam(resolvedSearchParams.next);
  const error = pickSearchParam(resolvedSearchParams.error);
  const success = pickSearchParam(resolvedSearchParams.success);

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

        <section className="glass-card tilt-panel animate-entrance-rise rounded-[36px] p-7 sm:p-8 animate-entrance-delay-2">
          <div className="grid rounded-[24px] bg-white/90 p-2 shadow-inner shadow-slate-200/70 sm:grid-cols-2 depth-ring">
            <a
              href="/register"
              className="inline-flex min-h-14 items-center justify-center rounded-[18px] px-6 text-base font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Sign up
            </a>
            <a
              href="/login"
              className="inline-flex min-h-14 items-center justify-center rounded-[18px] bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-6 text-base font-semibold text-white"
            >
              Log in
            </a>
          </div>

          <div className="mt-8">
            <h2 className="text-3xl font-semibold">Log in to your workspace</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Your dashboard adapts to your role: Admin, Manager, or User.
            </p>
          </div>

          {error ? (
            <div className="mt-6 rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 depth-ring">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-[20px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 depth-ring">
              {success}
            </div>
          ) : null}

          <form action={loginUser} className="mt-7 space-y-6">
            <input type="hidden" name="next" value={next ?? ""} />

            <label className="block space-y-3 text-base font-semibold text-slate-700">
              <span>Email</span>
              <input
                name="email"
                type="email"
                required
                className={inputClassName}
                placeholder="jordan@company.com"
              />
            </label>

            <label className="block space-y-3 text-base font-semibold text-slate-700">
              <span>Password</span>
              <input
                name="password"
                type="password"
                required
                className={inputClassName}
                placeholder="Enter your password"
              />
            </label>

            <button
              type="submit"
              className="min-h-14 w-full rounded-[20px] bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-6 text-lg font-semibold text-white shadow-[0_18px_50px_rgba(59,130,246,0.24)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Log in
            </button>
          </form>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {["Admin", "Manager", "User"].map((role) => (
              <div
                key={role}
                className="glass-card tilt-panel rounded-[20px] px-4 py-3 text-sm font-medium text-slate-600"
              >
                {role} access
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
