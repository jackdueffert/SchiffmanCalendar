import { format, isAfter, isSameDay, startOfDay } from 'date-fns';
import { CalendarEvent, DroppedFile, EVENT_TYPE_CONFIG } from '../types';
import MiniCalendar from './MiniCalendar';
import FileQueue from './FileQueue';

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  droppedFiles: DroppedFile[];
  onDateSelect: (date: Date) => void;
}

export default function Sidebar({ currentDate, events, droppedFiles, onDateSelect }: Props) {
  const today = startOfDay(new Date());

  const upcoming = events
    .filter(e => isAfter(startOfDay(e.date), today) || isSameDay(e.date, today))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6);

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Mini Calendar */}
        <div>
          <MiniCalendar currentDate={currentDate} events={events} />
        </div>

        <div className="border-t border-slate-100" />

        {/* Upcoming events */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Upcoming
          </h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">No upcoming events</p>
          ) : (
            <div className="space-y-1.5">
              {upcoming.map(event => {
                const config = EVENT_TYPE_CONFIG[event.type];
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors cursor-default"
                  >
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-700 truncate leading-snug">{event.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isSameDay(event.date, today)
                          ? 'Today'
                          : format(event.date, 'MMM d')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* File queue */}
        <FileQueue files={droppedFiles} />
      </div>
    </aside>
  );
}
