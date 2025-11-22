export const getPriorityColor = (dueDate: string) => {
  const now = new Date();
  const due = new Date(dueDate);

  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours < 0) return "red";        // overdue
  if (diffHours <= 24) return "red";      // due today or in <24h
  if (diffDays <= 3) return "orange";     // 1–3 days
  return "green";                         // >3 days
};
