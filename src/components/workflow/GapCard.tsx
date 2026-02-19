import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, AlertCircle } from 'lucide-react';
import { GapSlot, formatDuration, timeToMinutes, minutesToTime, mockSubtasks } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  gap: GapSlot;
  isExpanded: boolean;
  onToggle: () => void;
}

interface SplitRow {
  num: number;
  start: string;
  end: string;
}

const GapCard: React.FC<Props> = ({ gap, isExpanded, onToggle }) => {
  const gapMinutes = timeToMinutes(gap.endTime) - timeToMinutes(gap.startTime);

  const [startOffset, setStartOffset] = useState(0);
  const [endOffset, setEndOffset] = useState(gapMinutes);
  const [interval, setInterval] = useState(10);
  const [subtask, setSubtask] = useState('');
  const [kbMin, setKbMin] = useState(20);
  const [kbMax, setKbMax] = useState(80);
  const [mouseMin, setMouseMin] = useState(20);
  const [mouseMax, setMouseMax] = useState(80);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<'success' | 'error' | null>(null);

  const selectedStart = minutesToTime(timeToMinutes(gap.startTime) + startOffset);
  const selectedEnd = minutesToTime(timeToMinutes(gap.startTime) + endOffset);
  const selectedDuration = endOffset - startOffset;

  const splits: SplitRow[] = useMemo(() => {
    if (selectedDuration <= 0 || interval <= 0) return [];
    const rows: SplitRow[] = [];
    const baseMin = timeToMinutes(gap.startTime) + startOffset;
    const endMin = timeToMinutes(gap.startTime) + endOffset;
    let current = baseMin;
    let num = 1;

    // First split: start and end are the same
    rows.push({
      num,
      start: minutesToTime(baseMin),
      end: minutesToTime(baseMin),
    });
    num++;

    while (current < endMin) {
      const splitEnd = Math.min(current + interval, endMin);
      rows.push({
        num,
        start: minutesToTime(current),
        end: minutesToTime(splitEnd),
      });
      current = splitEnd;
      num++;
    }
    return rows;
  }, [startOffset, endOffset, interval, gap.startTime]);

  const totalScreenshots = 12; // mock
  const screenshotMatch = totalScreenshots >= splits.length;

  const canSubmit = subtask && splits.length > 0 && screenshotMatch && selectedDuration > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitResult('success');
    setSubmitting(false);
  };

  return (
    <div className="rounded-xl border border-gap-border bg-gap overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gap-border/20"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-warning/10">
            <Clock className="h-3 w-3 text-warning" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Available Time Slot</p>
            <p className="text-xs text-muted-foreground">
              {gap.startTime} → {gap.endTime} · {formatDuration(gap.startTime, gap.endTime)}
            </p>
          </div>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-gap-border p-4">
              {/* Section 1: Time Selection */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time Selection</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Start Time</label>
                    <Input
                      type="text"
                      value={selectedStart}
                      onChange={(e) => {
                        const val = e.target.value;
                        const mins = timeToMinutes(val);
                        if (!isNaN(mins)) {
                          const offset = mins - timeToMinutes(gap.startTime);
                          if (offset >= 0 && offset < endOffset) setStartOffset(offset);
                        }
                      }}
                      placeholder="HH:MM:SS"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">End Time</label>
                    <Input
                      type="text"
                      value={selectedEnd}
                      onChange={(e) => {
                        const val = e.target.value;
                        const mins = timeToMinutes(val);
                        if (!isNaN(mins)) {
                          const offset = mins - timeToMinutes(gap.startTime);
                          if (offset > startOffset && offset <= gapMinutes) setEndOffset(offset);
                        }
                      }}
                      placeholder="HH:MM:SS"
                      className="mt-2"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Selected duration: <span className="font-medium text-foreground">{selectedDuration}m</span></p>
              </section>

              {/* Section 2: Interval */}
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interval Configuration</h4>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={gapMinutes}
                    value={interval}
                    onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">minutes · {splits.length} splits</span>
                </div>
              </section>

              {/* Section 3: Subtask */}
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Subtask</h4>
                <Select value={subtask} onValueChange={setSubtask}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Choose a subtask..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {mockSubtasks.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!subtask && <p className="text-xs text-destructive">Subtask is required</p>}
              </section>

              {/* Section 4: KB & Mouse Range */}
              <section className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity Ranges</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Keyboard Activity</label>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[kbMin, kbMax]}
                      onValueChange={([a, b]) => { setKbMin(a); setKbMax(b); }}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{kbMin}% – {kbMax}%</span>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Mouse Activity</label>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[mouseMin, mouseMax]}
                      onValueChange={([a, b]) => { setMouseMin(a); setMouseMax(b); }}
                      className="mt-2"
                    />
                    <span className="text-xs text-muted-foreground">{mouseMin}% – {mouseMax}%</span>
                  </div>
                </div>
              </section>

              {/* Section 5: Split Preview */}
              {splits.length > 0 && (
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Split Preview</h4>
                  <div className="max-h-48 overflow-auto rounded-lg border border-border scrollbar-thin">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Split #</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Start</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">End</th>
                        </tr>
                      </thead>
                      <tbody>
                        {splits.map((s) => (
                          <tr key={s.num} className="border-b border-border last:border-0">
                            <td className="px-3 py-1.5 text-muted-foreground">{s.num}</td>
                            <td className="px-3 py-1.5 font-medium text-foreground">{s.start}</td>
                            <td className="px-3 py-1.5 font-medium text-foreground">{s.end}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Section 6: Screenshot Status */}
              <section className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Screenshot Status</h4>
                <div className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                  screenshotMatch
                    ? 'border-success/30 bg-success/5 text-success'
                    : 'border-destructive/30 bg-destructive/5 text-destructive'
                )}>
                  {screenshotMatch ? (
                    <>✓ {totalScreenshots} screenshots available for {splits.length} splits</>
                  ) : (
                    <><AlertCircle className="h-4 w-4" /> {totalScreenshots} screenshots available but {splits.length} needed</>
                  )}
                </div>
              </section>

              {/* Section 7: Submit */}
              <section className="flex items-center gap-3">
                <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                  {submitting ? 'Submitting...' : 'Submit Activity'}
                </Button>
                {submitResult === 'success' && (
                  <span className="text-sm text-success">Activity submitted successfully!</span>
                )}
                {submitResult === 'error' && (
                  <span className="text-sm text-destructive">Failed to submit. Try again.</span>
                )}
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GapCard;
