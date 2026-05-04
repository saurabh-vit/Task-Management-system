"use client";

import { useOptimistic, useRef, useTransition } from "react";

interface QuickCompleteCheckboxProps {
  action: (formData: FormData) => Promise<void>;
  checked: boolean;
  label: string;
  taskId: string;
  returnTo: string;
}

export function QuickCompleteCheckbox({
  action,
  checked,
  label,
  taskId,
  returnTo,
}: QuickCompleteCheckboxProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(checked);

  return (
    <form ref={formRef} action={action} className="inline-flex items-center gap-3">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input
        ref={statusInputRef}
        type="hidden"
        name="status"
        defaultValue={checked ? "DONE" : "TODO"}
      />

      <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          checked={optimisticChecked}
          disabled={isPending}
          onChange={(event) => {
            const nextChecked = event.currentTarget.checked;

            if (statusInputRef.current) {
              statusInputRef.current.value = nextChecked ? "DONE" : "TODO";
            }

            startTransition(() => {
              setOptimisticChecked(nextChecked);
              formRef.current?.requestSubmit();
            });
          }}
        />
        <span>{isPending ? "Updating..." : label}</span>
      </label>
    </form>
  );
}
