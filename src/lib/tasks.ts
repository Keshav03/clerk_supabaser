export const TASK_STATUSES = ["todo", "doing", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  doing: "Doing",
  done: "Done",
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" && TASK_STATUSES.includes(value as TaskStatus)
  );
}
