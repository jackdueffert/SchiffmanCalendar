import { useState, useEffect, FormEvent } from 'react';
import { format } from 'date-fns';
import { X, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { CalendarEvent, EventType, EVENT_TYPE_CONFIG } from '../types';

interface Props {
  date: Date;
  onSave: (event: CalendarEvent) => void;
  onClose: () => void;
}

const TYPE_ROWS: EventType[][] = [
  ['expiration', 'rent_increase', 'option', 'critical'],
  ['deadline', 'meeting', 'task', 'reminder'],
];

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
}

export { formatTimeDisplay };

export default function AddEventModal({ date, onSave, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [dateVal, setDateVal] = useState(format(date, 'yyyy-MM-dd'));
  const [timeVal, setTimeVal] = useState('');
  const [type, setType] = useState<EventType>('meeting');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateVal) return;

    const [y, m, d] = dateVal.split('-').map(Number);
    const eventDate = new Date(y, m - 1, d);

    onSave({
      id: crypto.randomUUID(),
      title: title.trim(),
      date: eventDate,
      time: timeVal || undefined,
      type,
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        {/* Accent bar — color changes with selected type */}
        <div className={clsx('h-1.5 transition-colors', EVENT_TYPE_CONFIG[type].bg)} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-slate-900">Add Event</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Event Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Lease Expiration, Board Meeting…"
                required
                autoFocus
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition"
              />
            </div>

            {/* Date + Time */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dateVal}
                  onChange={e => setDateVal(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition"
                />
              </div>
              <div className="w-40">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Time <span className="text-slate-300">(optional)</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="time"
                    value={timeVal}
                    onChange={e => setTimeVal(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 transition"
                  />
                </div>
              </div>
            </div>

            {/* Type selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Type
              </label>
              <div className="space-y-1.5">
                {TYPE_ROWS.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-4 gap-1.5">
                    {row.map(t => {
                      const cfg = EVENT_TYPE_CONFIG[t];
                      const active = type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={clsx(
                            'py-1.5 px-1 rounded-lg text-xs font-semibold transition-all border',
                            active
                              ? `${cfg.bg} text-white border-transparent shadow-sm`
                              : 'text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                          )}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Notes <span className="text-slate-300">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add context, clause references, or any other details…"
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900 placeholder-slate-400 transition resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-5 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors shadow-sm"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
