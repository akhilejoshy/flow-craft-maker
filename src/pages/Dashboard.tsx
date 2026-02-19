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

  const timeline = useMemo(() => buildTimeline(mockWorkflowBlocks), []);
  const totalWork = useMemo(() => getTotalWorkTime(mockWorkflowBlocks), []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Workflow Activity Generator</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and generate workflow activities</p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover z-50" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
            <Clock className="h-3.5 w-3.5" />
            {totalWork}
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
