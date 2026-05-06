import { clsx } from 'clsx';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, format,
} from 'date-fns';
import { CalendarEvent } from '../types';
import EventChip from './EventChip';

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const DAY_HEADERS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CalendarGrid({ currentDate, events, onEventClick }: Props) {
  const monthStart = startOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(endOfMonth(currentDate));
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (day: Date) =>
    events
      .filter(e => isSameDay(e.date, day))
      .sort((a, b) => {
        const order: Record<string, number> = {
          expiration: 0, critical: 1, option: 2, rent_increase: 3,
          deadline: 4, meeting: 5, task: 6, reminder: 7,
        };
        return (order[a.type] ?? 9) - (order[b.type] ?? 9);
      });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-white flex-shrink-0">
        {DAY_HEADERS.map((day, i) => (
          <div
            key={day}
            className={clsx(
              'py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider',
              (i === 0 || i === 6) && 'text-slate-400',
            )}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="inline sm:hidden">{day.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-7 overflow-y-auto" style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(120px, 1fr))` }}>
        {days.map((day, i) => {
          const inCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const dayEvents = getEventsForDay(day);
          const maxVisible = 3;
          const visibleEvents = dayEvents.slice(0, maxVisible);
          const overflow = dayEvents.length - maxVisible;
          const isWeekend = i % 7 === 0 || i % 7 === 6;

          return (
            <div
              key={i}
              className={clsx(
                'p-1.5 border-b border-r border-slate-100 relative transition-colors',
                inCurrentMonth
                  ? isWeekend ? 'bg-slate-50/40' : 'bg-white'
                  : 'bg-slate-50/70',
                'hover:bg-indigo-50/20',
                i % 7 === 0 && 'border-l border-slate-100',
              )}
            >
              {/* Date number */}
              <div className="flex items-start justify-between mb-1">
                <span
                  className={clsx(
                    'inline-flex w-7 h-7 items-center justify-center text-sm rounded-full font-medium transition-colors',
                    today
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : inCurrentMonth
                      ? 'text-slate-700 hover:bg-slate-100'
                      : 'text-slate-350 text-slate-300',
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {visibleEvents.map(event => (
                  <EventChip key={event.id} event={event} onClick={() => onEventClick(event)} />
                ))}
                {overflow > 0 && (
                  <button className="w-full text-left text-xs text-slate-400 hover:text-indigo-600 px-1 py-0.5 transition-colors font-medium">
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
