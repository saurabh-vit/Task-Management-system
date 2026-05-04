export function DashboardWorkspaceSkeleton() {
  return (
    <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-8">
        <div className="rounded-lg border border-white/70 bg-white/80 px-6 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        </div>
        <div className="h-[28rem] animate-pulse rounded-lg border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="min-h-[20rem] animate-pulse rounded-lg border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur"
          />
        ))}
      </div>
    </section>
  );
}
