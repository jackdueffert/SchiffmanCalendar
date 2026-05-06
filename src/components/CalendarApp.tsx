import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { addMonths, subMonths } from 'date-fns';
import Header from './Header';
import Sidebar from './Sidebar';
import CalendarGrid from './CalendarGrid';
import EventModal from './EventModal';
import AddEventModal from './AddEventModal';
import FileDropOverlay from './FileDropOverlay';
import { CalendarEvent, DroppedFile, EventType, normalizeEventType } from '../types';
import { authFetch, clearToken } from '../lib/apiClient';

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function handle401(res: Response, onLogout: () => void): boolean {
  if (res.status === 401) {
    clearToken();
    onLogout();
    return true;
  }
  return false;
}

interface RawEvent {
  title: string;
  date: string;
  type: string;
  description?: string;
}

interface Props {
  onLogout: () => void;
}

export default function CalendarApp({ onLogout }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [addingForDate, setAddingForDate] = useState<Date | null>(null);

  // Load events from server on mount
  useEffect(() => {
    authFetch('/api/events')
      .then(async res => {
        if (handle401(res, onLogout)) return;
        const { events: rows } = await res.json();
        setEvents(
          rows.map((e: CalendarEvent & { date: string }) => ({
            ...e,
            date: parseDate(e.date),
          })),
        );
      })
      .catch(err => console.error('Failed to load events:', err))
      .finally(() => setEventsLoaded(true));
  }, [onLogout]);

  const handlePrevMonth = () => setCurrentDate(d => subMonths(d, 1));
  const handleNextMonth = () => setCurrentDate(d => addMonths(d, 1));
  const handleGoToToday = () => setCurrentDate(new Date());

  const saveEventToServer = async (event: CalendarEvent) => {
    const res = await authFetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: event.id,
        title: event.title,
        date: event.date.toISOString().split('T')[0],
        time: event.time,
        type: event.type,
        description: event.description,
        sourceFile: event.sourceFile,
      }),
    });
    if (handle401(res, onLogout)) throw new Error('Unauthorized');
    if (!res.ok) throw new Error('Failed to save event');
  };

  const deleteEventFromServer = async (id: string) => {
    const res = await authFetch(`/api/events/${id}`, { method: 'DELETE' });
    if (handle401(res, onLogout)) throw new Error('Unauthorized');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const pairs = acceptedFiles.map(file => ({
      file,
      entry: {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending' as const,
        droppedAt: new Date(),
      } satisfies DroppedFile,
    }));

    setDroppedFiles(prev => [...pairs.map(p => p.entry), ...prev]);

    await Promise.allSettled(
      pairs.map(async ({ file, entry }) => {
        await new Promise(r => setTimeout(r, 250));
        setDroppedFiles(prev =>
          prev.map(f => (f.id === entry.id ? { ...f, status: 'processing' } : f)),
        );

        try {
          const form = new FormData();
          form.append('file', file);

          const res = await authFetch('/api/analyze', { method: 'POST', body: form });
          if (handle401(res, onLogout)) return;

          if (!res.ok) {
            const body = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(body.error ?? res.statusText);
          }

          const { events: raw }: { events: RawEvent[] } = await res.json();

          const extracted: CalendarEvent[] = raw
            .filter(e => e.date && e.title)
            .map(e => ({
              id: crypto.randomUUID(),
              title: e.title,
              date: parseDate(e.date),
              type: normalizeEventType(e.type) as EventType,
              description: e.description,
              sourceFile: entry.name,
            }));

          await Promise.all(extracted.map(saveEventToServer));

          setDroppedFiles(prev =>
            prev.map(f =>
              f.id === entry.id ? { ...f, status: 'completed', extractedEvents: extracted } : f,
            ),
          );

          if (extracted.length > 0) {
            setEvents(prev => [...prev, ...extracted]);
            const earliest = extracted.reduce((a, b) => (a.date < b.date ? a : b));
            setCurrentDate(new Date(earliest.date.getFullYear(), earliest.date.getMonth(), 1));
          }
        } catch (err) {
          console.error(`Analysis failed for ${entry.name}:`, err);
          setDroppedFiles(prev =>
            prev.map(f => (f.id === entry.id ? { ...f, status: 'error' } : f)),
          );
        }
      }),
    );
  }, [onLogout]);

  const handleDeleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setSelectedEvent(null);
    await deleteEventFromServer(id).catch(err => console.error('Delete failed:', err));
  };

  const handleSaveNewEvent = async (event: CalendarEvent) => {
    setEvents(prev => [...prev, event]);
    setCurrentDate(new Date(event.date.getFullYear(), event.date.getMonth(), 1));
    setAddingForDate(null);
    await saveEventToServer(event).catch(err => console.error('Save failed:', err));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div {...getRootProps()} className="h-screen flex flex-col bg-slate-50 relative select-none">
      <input {...getInputProps()} />

      {isDragActive && <FileDropOverlay />}

      <Header
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onGoToToday={handleGoToToday}
        onNavigateTo={setCurrentDate}
        onLogout={onLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentDate={currentDate}
          events={events}
          droppedFiles={droppedFiles}
          onDateSelect={date =>
            setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1))
          }
        />
        <CalendarGrid
          currentDate={currentDate}
          events={events}
          onEventClick={setSelectedEvent}
          onCellClick={setAddingForDate}
        />
      </div>

      {!eventsLoaded && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="flex items-center gap-3 text-slate-500">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm font-medium">Loading events…</span>
          </div>
        </div>
      )}

      {addingForDate && (
        <AddEventModal
          date={addingForDate}
          onSave={handleSaveNewEvent}
          onClose={() => setAddingForDate(null)}
        />
      )}

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}
