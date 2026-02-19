export interface WorkflowBlock {
  id: string;
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
  subtask: string;
  type: 'existing';
}

export interface GapSlot {
  id: string;
  startTime: string;
  endTime: string;
  type: 'gap';
}

export type TimelineItem = WorkflowBlock | GapSlot;

export interface Subtask {
  id: string;
  name: string;
}

export const mockSubtasks: Subtask[] = [
  { id: '1', name: 'Code Review' },
  { id: '2', name: 'Feature Development' },
  { id: '3', name: 'Bug Fixing' },
  { id: '4', name: 'Documentation' },
  { id: '5', name: 'Testing & QA' },
  { id: '6', name: 'Design Review' },
  { id: '7', name: 'Sprint Planning' },
  { id: '8', name: 'Standup Meeting' },
  { id: '9', name: 'Client Communication' },
  { id: '10', name: 'Database Migration' },
];

export const mockWorkflowBlocks: WorkflowBlock[] = [
  { id: 'b1', startTime: '09:00:00', endTime: '09:45:00', subtask: 'Standup Meeting', type: 'existing' },
  { id: 'b2', startTime: '10:30:00', endTime: '12:00:00', subtask: 'Feature Development', type: 'existing' },
  { id: 'b3', startTime: '13:00:00', endTime: '14:30:00', subtask: 'Code Review', type: 'existing' },
  { id: 'b4', startTime: '15:00:00', endTime: '16:00:00', subtask: 'Bug Fixing', type: 'existing' },
  { id: 'b5', startTime: '16:30:00', endTime: '17:30:00', subtask: 'Documentation', type: 'existing' },
];

function timeToSeconds(time: string): number {
  const [h, m, s] = time.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function secondsToTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return [h, m, s]
    .map(v => v.toString().padStart(2, "0"))
    .join(":");
}

export function buildTimeline(blocks: WorkflowBlock[]): TimelineItem[] {
  const sorted = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const timeline: TimelineItem[] = [];

  for (let i = 0; i < sorted.length; i++) {
    timeline.push(sorted[i]);
    if (i < sorted.length - 1) {
      const currentEnd = timeToSeconds(sorted[i].endTime);
      const nextStart = timeToSeconds(sorted[i + 1].startTime);

      const gapStart = currentEnd + 5;
      const gapEnd = nextStart - 5;
      if (gapStart < gapEnd) {
        timeline.push({
          id: `gap-${i}`,
          startTime: secondsToTime(gapStart),
          endTime: secondsToTime(gapEnd),
          type: 'gap',
        });
      }
    }
  }

  return timeline;
}

export function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

export function formatDuration(startTime: string, endTime: string): string {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function getTotalWorkTime(blocks: WorkflowBlock[]): string {
  const total = blocks.reduce((sum, b) => sum + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${mins}m`;
}
