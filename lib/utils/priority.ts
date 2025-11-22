// returns color hex for priority based on due date distance
export function getPriorityColor(dueDateIso: string | undefined): string {
  if (!dueDateIso) return "#9CA3AF"; // gray

  const due = new Date(dueDateIso).getTime();
  const now = Date.now();
  const diff = due - now; // ms remaining

  if (diff <= 0) return "#ef4444"; // red - overdue
  const days = diff / (1000 * 60 * 60 * 24);

  if (days <= 1) return "#ef4444"; // red
  if (days <= 3) return "#f97316"; // orange
  return "#10b981"; // green
}
