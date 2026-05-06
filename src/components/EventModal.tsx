import { useEffect } from 'react';
import { format } from 'date-fns';
import { X, Trash2, Calendar, Clock, FileText, Tag } from 'lucide-react';

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
}
import { CalendarEvent, EVENT_TYPE_CONFIG } from '../types';

interface Props {
  event: CalendarEvent;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export default function EventModal({ event, onClose, onDelete }: Props) {
  const config = EVENT_TYPE_CONFIG[event.type];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Type color bar */}
        <div className={`h-1.5 ${config.bg}`} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border mb-2 ${config.light}`}>
                <Tag className="w-3 h-3 mr-1" />
                {config.label}
              </span>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{event.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <span className="font-medium">{format(event.date, 'EEEE, MMMM d, yyyy')}</span>
                {event.time && (
                  <span className="ml-2 inline-flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    {formatTimeDisplay(event.time)}
                  </span>
                )}
              </div>
            </div>

            {event.description && (
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed border border-slate-100">
                {event.description}
              </div>
            )}

            {event.sourceFile && (
              <div className="flex items-center gap-2.5 text-sm text-slate-500">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Extracted from</span>
                  <span className="text-slate-600 font-medium">{event.sourceFile}</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onDelete(event.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm bg-slate-900 text-white hover:bg-slate-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
