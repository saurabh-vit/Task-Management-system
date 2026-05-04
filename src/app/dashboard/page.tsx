import type { Route } from "next";
import { DashboardWorkspace } from "@/components/dashboard/DashboardWorkspace";
import { DashboardWorkspaceSkeleton } from "@/components/dashboard/DashboardWorkspaceSkeleton";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface DashboardPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/dashboard" as Route);
  }

  return (
    <main className="app-viewport mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12">
      <div className="app-grid-overlay" />
      <Suspense fallback={<DashboardWorkspaceSkeleton />}>
        <DashboardWorkspace
          session={session}
          searchParamsPromise={searchParams}
        />
      </Suspense>
    </main>
  );
}
