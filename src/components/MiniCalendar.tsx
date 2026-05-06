import { clsx } from 'clsx';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, format,
} from 'date-fns';
import { CalendarEvent } from '../types';

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MiniCalendar({ currentDate, events }: Props) {
  const monthStart = startOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(endOfMonth(currentDate));
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const hasEvents = (day: Date) => events.some(e => isSameDay(e.date, day));

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 text-center mb-3">
        {format(currentDate, 'MMMM yyyy')}
      </p>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-slate-400 py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const withEvent = inMonth && hasEvents(day);

          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <span
                className={clsx(
                  'w-6 h-6 flex items-center justify-center text-xs rounded-full font-medium leading-none',
                  today ? 'bg-indigo-600 text-white' :
                  inMonth ? 'text-slate-600 hover:bg-slate-100 cursor-default' :
                  'text-slate-300',
                )}
              >
                {format(day, 'd')}
              </span>
              {withEvent && (
                <span className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
