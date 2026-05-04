import { redirect } from "next/navigation";

import { registerUser } from "@/app/auth-actions";
import { pickSearchParam } from "@/lib/action-utils";
import { getSession } from "@/lib/auth/session";
import { countUsers } from "@/lib/auth/users";

interface RegisterPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const inputClassName =
  "min-h-14 w-full rounded-[20px] border border-slate-200 bg-white px-5 py-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100";

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const next = pickSearchParam(resolvedSearchParams.next);
  const error = pickSearchParam(resolvedSearchParams.error);
  const totalUsers = await countUsers();
  const assignedRole = totalUsers === 0 ? "Admin" : "User";

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
              className="inline-flex min-h-14 items-center justify-center rounded-[18px] bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-6 text-base font-semibold text-white"
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

          <div className="mt-8">
            <h2 className="text-3xl font-semibold">Create your account</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Start with secure access. The first account becomes Admin; later
              accounts start as User until an Admin changes the role.
            </p>
          </div>

          {error ? (
            <div className="mt-6 rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 depth-ring">
              {error}
            </div>
          ) : null}

          <form action={registerUser} className="mt-7 space-y-6">
            <input type="hidden" name="next" value={next ?? ""} />

            <label className="block space-y-3 text-base font-semibold text-slate-700">
              <span>Name</span>
              <input
                name="name"
                type="text"
                className={inputClassName}
                placeholder="Jordan Lee"
              />
            </label>

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
                placeholder="At least 8 characters"
              />
            </label>

            <label className="block space-y-3 text-base font-semibold text-slate-700">
              <span>Confirm password</span>
              <input
                name="confirmPassword"
                type="password"
                required
                className={inputClassName}
                placeholder="Repeat your password"
              />
            </label>

            <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,1),_rgba(255,255,255,1))] p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Role</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Assigned automatically to keep the access model secure.
                  </p>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${assignedRole === "Admin" ? "from-amber-400 via-orange-500 to-rose-500" : "from-sky-500 via-cyan-500 to-emerald-500"} px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(59,130,246,0.25)]`}>
                  <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
                  {assignedRole}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="min-h-14 w-full rounded-[20px] bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-500 px-6 text-lg font-semibold text-white shadow-[0_18px_50px_rgba(59,130,246,0.24)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Create account
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
