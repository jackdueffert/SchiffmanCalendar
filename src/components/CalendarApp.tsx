import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { addMonths, subMonths } from 'date-fns';
import Header from './Header';
import Sidebar from './Sidebar';
import CalendarGrid from './CalendarGrid';
import EventModal from './EventModal';
import FileDropOverlay from './FileDropOverlay';
import { CalendarEvent, DroppedFile, EventType, EVENT_TYPE_CONFIG, normalizeEventType } from '../types';

const EVENTS_KEY = 'schiffman_cal_events';

function persistEvents(events: CalendarEvent[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

function loadEvents(): CalendarEvent[] {
  try {
    const saved = localStorage.getItem(EVENTS_KEY);
    if (!saved) return [];
    return (JSON.parse(saved) as Array<CalendarEvent & { date: string }>).map(e => ({
      ...e,
      date: new Date(e.date),
    }));
  } catch {
    return [];
  }
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
  const [events, setEvents] = useState<CalendarEvent[]>(loadEvents);
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Persist whenever events change
  useEffect(() => {
    persistEvents(events);
  }, [events]);

  const handlePrevMonth = () => setCurrentDate(d => subMonths(d, 1));
  const handleNextMonth = () => setCurrentDate(d => addMonths(d, 1));
  const handleGoToToday = () => setCurrentDate(new Date());

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

    // Analyze all files in parallel
    await Promise.allSettled(
      pairs.map(async ({ file, entry }) => {
        // Brief pause so the pending state renders before spinner kicks in
        await new Promise(r => setTimeout(r, 250));

        setDroppedFiles(prev =>
          prev.map(f => (f.id === entry.id ? { ...f, status: 'processing' } : f)),
        );

        try {
          const form = new FormData();
          form.append('file', file);

          const res = await fetch('http://localhost:3001/api/analyze', {
            method: 'POST',
            body: form,
          });

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
              date: new Date(e.date),
              type: normalizeEventType(e.type) as EventType,
              description: e.description,
              sourceFile: entry.name,
            }));

          setDroppedFiles(prev =>
            prev.map(f =>
              f.id === entry.id ? { ...f, status: 'completed', extractedEvents: extracted } : f,
            ),
          );

          if (extracted.length > 0) {
            setEvents(prev => {
              const updated = [...prev, ...extracted];
              persistEvents(updated);
              return updated;
            });
            // Navigate to the month of the earliest extracted event
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
  }, []);

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      persistEvents(updated);
      return updated;
    });
    setSelectedEvent(null);
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
        />
      </div>

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
