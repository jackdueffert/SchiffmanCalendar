import { CalendarDays, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  onLogout: () => void;
}

export default function Header({ currentDate, onPrevMonth, onNextMonth, onGoToToday, onLogout }: Props) {
  return (
    <header className="flex-shrink-0 bg-gradient-to-r from-indigo-700 to-indigo-600 text-white px-6 py-0 flex items-center justify-between shadow-md h-16 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <CalendarDays className="w-6 h-6 text-indigo-200" strokeWidth={1.75} />
        <span className="font-semibold text-base tracking-tight">
          Schiffman Calendar
        </span>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevMonth}
          className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-[180px] text-center">
          <span className="text-lg font-semibold tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </span>
        </div>
        <button
          onClick={onNextMonth}
          className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Right: today button + logout */}
      <div className="flex items-center gap-3">
        <button
          onClick={onGoToToday}
          className="text-sm font-medium text-indigo-100 hover:text-white transition-colors hidden sm:block"
        >
          Today
        </button>
        <div className="w-px h-5 bg-indigo-500/50" />
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-sm text-indigo-200 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
