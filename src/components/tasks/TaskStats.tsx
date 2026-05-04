import type { TaskWithRelations } from "@/lib/tasks/queries";

interface TaskStatsProps {
  tasks: TaskWithRelations[];
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "DONE").length;
  const pending = tasks.filter((task) => task.status !== "DONE").length;
  const urgent = tasks.filter((task) => task.priority === "URGENT").length;
  const inReview = tasks.filter((task) => task.status === "IN_REVIEW").length;

  const completionRate =
    total === 0 ? 0 : Math.round((completed / Math.max(total, 1)) * 100);

  const stats = [
    {
      label: "Visible tasks",
      value: total,
      helper: "Everything in your current filter view",
    },
    {
      label: "Pending",
      value: pending,
      helper: `${completionRate}% completion rate`,
    },
    {
      label: "Completed",
      value: completed,
      helper: "Finished work across active filters",
    },
    {
      label: "Needs attention",
      value: urgent + inReview,
      helper: `${urgent} urgent, ${inReview} in review`,
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="rounded-lg border border-white/70 bg-white/90 px-5 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur"
        >
          <p className="font-mono text-xs uppercase text-slate-500">
            {stat.label}
          </p>
          <p className="mt-4 text-4xl font-semibold text-slate-950">
            {stat.value}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">{stat.helper}</p>
        </article>
      ))}
    </section>
  );
}
