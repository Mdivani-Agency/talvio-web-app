import type { ApplicationEvent } from '@/lib/adapters/application.adapter';
import { HISTORY_ADDED, HISTORY_MOVED, STAGE_NAMES, fullDate } from '@/lib/applications-copy';

import { calendarDay } from '../../board';

/** Stage changes, newest first: "17 Nov 2026 · Moved to Interview". */
export function HistorySection({ events }: { events: ApplicationEvent[] }) {
  return (
    <ol className="flex flex-col gap-1.5 text-[1.3rem] text-muted-foreground">
      {events.map((event) => (
        <li key={event.id}>
          {fullDate(calendarDay(event.createdAt))} · {event.fromStage ? HISTORY_MOVED : HISTORY_ADDED}{' '}
          <strong className="font-semibold text-foreground">{STAGE_NAMES[event.toStage]}</strong>
        </li>
      ))}
    </ol>
  );
}
