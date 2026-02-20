import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { mockWorkflowBlocks, buildTimeline, getTotalWorkTime } from '@/data/mockData';
import ExistingBlockCard from '@/components/workflow/ExistingBlockCard';
import GapCard from '@/components/workflow/GapCard';

const Dashboard: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [expandedGap, setExpandedGap] = useState<string | null>(null);

  const timeline = useMemo(() => buildTimeline(mockWorkflowBlocks), [date]);
  const totalWork = useMemo(() => getTotalWorkTime(mockWorkflowBlocks), [date]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6">
      {/* Compact toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full sm:w-auto justify-start text-left font-normal border-border bg-card text-foreground',
                'hover:bg-accent/10 transition-colors'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              <span className="font-medium">{format(date, 'EEE, MMM d yyyy')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(d);
                  setExpandedGap(null);
                }
              }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Total Work Time pill */}
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 self-start sm:self-auto">
          <Clock className="h-4 w-4 text-primary" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70">Total Work</span>
            <span className="text-sm font-semibold text-primary">{totalWork}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {timeline.map((item) =>
          item.type === 'existing' ? (
            <ExistingBlockCard key={item.id} block={item} />
          ) : (
            <GapCard
              key={item.id}
              gap={item}
              isExpanded={expandedGap === item.id}
              onToggle={() => setExpandedGap(expandedGap === item.id ? null : item.id)}
            />
          )
        )}
      </div>
    </div>
  );
};

export default Dashboard;
