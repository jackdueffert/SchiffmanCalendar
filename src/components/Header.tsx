import { useRef, useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown, LogOut } from 'lucide-react';
import { format, getMonth, getYear } from 'date-fns';
import { clsx } from 'clsx';

interface Props {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  onNavigateTo: (date: Date) => void;
  onLogout: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

const START_YEAR = 2023;
const END_YEAR = new Date().getFullYear() + 5;
const YEARS = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

export default function Header({
  currentDate, onPrevMonth, onNextMonth, onGoToToday, onNavigateTo, onLogout,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeYearRef = useRef<HTMLButtonElement>(null);

  const activeMonth = getMonth(currentDate);
  const activeYear = getYear(currentDate);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const onMouse = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  // Scroll active year into view when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => activeYearRef.current?.scrollIntoView({ block: 'nearest' }), 0);
    }
  }, [isOpen]);

  const handleMonth = (monthIndex: number) => {
    onNavigateTo(new Date(activeYear, monthIndex, 1));
    setIsOpen(false);
  };

  const handleYear = (year: number) => {
    onNavigateTo(new Date(year, activeMonth, 1));
    setIsOpen(false);
  };

  return (
    <header className="flex-shrink-0 bg-gradient-to-r from-indigo-700 to-indigo-600 text-white px-6 py-0 flex items-center justify-between shadow-md h-16 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <CalendarDays className="w-6 h-6 text-indigo-200" strokeWidth={1.75} />
        <span className="font-semibold text-base tracking-tight">Schiffman Calendar</span>
      </div>

      {/* Month/year navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrevMonth}
          className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Picker trigger + dropdown */}
        <div className="relative" ref={wrapperRef}>
          <button
            onClick={() => setIsOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/15 transition-colors min-w-[190px] justify-center"
          >
            <span className="text-lg font-semibold tracking-tight">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <ChevronDown
              className={clsx('w-4 h-4 text-indigo-200 transition-transform duration-200', isOpen && 'rotate-180')}
            />
          </button>

          {isOpen && (
            <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex overflow-hidden animate-fade-in-up">
              {/* Months grid */}
              <div className="p-4 border-r border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 px-1">
                  Month
                </p>
                <div className="grid grid-cols-3 gap-1 w-48">
                  {MONTHS.map((month, i) => (
                    <button
                      key={month}
                      onClick={() => handleMonth(i)}
                      className={clsx(
                        'py-1.5 px-1 rounded-lg text-sm font-medium transition-colors',
                        i === activeMonth
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700',
                      )}
                    >
                      {month.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Years list */}
              <div className="p-4 w-28">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 px-1">
                  Year
                </p>
                <div className="overflow-y-auto max-h-52 space-y-0.5 pr-1">
                  {YEARS.map(year => (
                    <button
                      key={year}
                      ref={year === activeYear ? activeYearRef : undefined}
                      onClick={() => handleYear(year)}
                      className={clsx(
                        'w-full py-1.5 px-2 rounded-lg text-sm font-medium transition-colors text-left',
                        year === activeYear
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700',
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onNextMonth}
          className="p-1.5 rounded-lg hover:bg-white/15 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Right: today + logout */}
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
