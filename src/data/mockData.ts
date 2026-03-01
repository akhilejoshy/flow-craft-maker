import type { WorkflowBlock } from "@/store/slices/workFlow";

export interface GapSlot {
  id: string;
  startTime: string;
  endTime: string;
  type: 'gap';
}

function extractTime(iso: string): string {
  return new Date(iso).toTimeString().split(" ")[0]; // HH:mm:ss
}

export type TimelineItem = WorkflowBlock | GapSlot;

export function buildTimeline(blocks: WorkflowBlock[]): TimelineItem[] {
  if (blocks.length === 0) return [];
  const sorted = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const timeline: TimelineItem[] = [];
  const DAY_END = 86395; // 23:59:55 (adjusting for your 5s buffer)
  
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
  const lastBlockEnd = timeToSeconds(sorted[sorted.length - 1].endTime);
  if (lastBlockEnd < DAY_END) {
    timeline.push({
      id: 'gap-after-last',
      startTime: secondsToTime(lastBlockEnd + 5),
      endTime: '23:59:55', // Or use secondsToTime(DAY_END)
      type: 'gap',
    });
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

/** Parse HH:MM:SS → total seconds */
export function timeToSeconds(time: string): number {
  const parts = time.split(':').map(Number);
  return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
}

/** Total seconds → HH:MM:SS */
export function secondsToTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDuration(startTime: string, endTime: string): string {
  const toSeconds = (time: string) => {
    const [h, m, s] = time.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  let diff = toSeconds(endTime) - toSeconds(startTime);

  // Handle crossing midnight
  if (diff < 0) {
    diff += 24 * 3600;
  }

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function getTotalWorkTime(blocks: WorkflowBlock[]): string {
  const total = blocks.reduce((sum, b) => sum + timeToMinutes(b.endTime) - timeToMinutes(b.startTime), 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${hours}h ${mins}m`;
}
