import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { addMonths, subMonths, addDays } from 'date-fns';
import Header from './Header';
import Sidebar from './Sidebar';
import CalendarGrid from './CalendarGrid';
import EventModal from './EventModal';
import FileDropOverlay from './FileDropOverlay';
import { CalendarEvent, DroppedFile } from '../types';

const TODAY = new Date();

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Board Meeting',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 7),
    type: 'meeting',
    description: 'Quarterly board meeting — prepare Q1 summary slides and financials.',
    color: '#3B82F6',
  },
  {
    id: 'e2',
    title: 'Contract Renewal',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 12),
    type: 'deadline',
    description: 'Client master service agreement renewal deadline. Legal review required by COB.',
    color: '#EF4444',
  },
  {
    id: 'e3',
    title: 'Tax Filing Deadline',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 15),
    type: 'deadline',
    description: 'Q1 estimated tax payment and filing deadline.',
    color: '#EF4444',
  },
  {
    id: 'e4',
    title: 'Weekly Standup',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 6),
    type: 'meeting',
    description: 'Weekly team standup — review sprint progress and blockers.',
    color: '#3B82F6',
  },
  {
    id: 'e5',
    title: 'Vendor Proposal Review',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 10),
    type: 'task',
    description: 'Review and score three vendor proposals for Q3 cloud infrastructure initiative.',
    color: '#10B981',
  },
  {
    id: 'e6',
    title: 'Performance Reviews',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 20),
    type: 'meeting',
    description: 'Annual employee performance review cycle begins. All managers to complete by EOM.',
    color: '#3B82F6',
  },
  {
    id: 'e7',
    title: 'Project Alpha Launch',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 22),
    type: 'deadline',
    description: 'Project Alpha production launch. All features frozen 48h prior.',
    color: '#EF4444',
  },
  {
    id: 'e8',
    title: 'Budget Report Due',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 28),
    type: 'deadline',
    description: 'Monthly operating budget report submission to CFO.',
    color: '#EF4444',
  },
  {
    id: 'e9',
    title: 'New Client Kickoff',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 8),
    type: 'meeting',
    description: 'Kickoff call with Meridian Group — introductions, scope review, timeline alignment.',
    color: '#3B82F6',
  },
  {
    id: 'e10',
    title: 'Docs Update v2.0',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 14),
    type: 'task',
    description: 'Update all public-facing product documentation for the v2.0 release.',
    color: '#10B981',
  },
  {
    id: 'e11',
    title: 'Insurance Renewal',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 17),
    type: 'reminder',
    description: 'Annual business insurance policy renewal — contact broker for updated quote.',
    color: '#F59E0B',
  },
  {
    id: 'e12',
    title: 'Security Audit',
    date: new Date(TODAY.getFullYear(), TODAY.getMonth(), 24),
    type: 'task',
    description: 'Quarterly security audit with external firm — provide access credentials 24h before.',
    color: '#10B981',
  },
];

function generateMockEvents(file: DroppedFile): CalendarEvent[] {
  const base = new Date();
  const offset1 = Math.floor(Math.random() * 25) + 4;
  const offset2 = Math.floor(Math.random() * 20) + 2;
  const baseName = file.name.replace(/\.[^.]+$/, '');

  return [
    {
      id: crypto.randomUUID(),
      title: `Deadline: ${baseName}`,
      date: addDays(base, offset1),
      type: 'deadline',
      description: `Deadline automatically extracted from "${file.name}" via Claude AI document analysis.`,
      sourceFile: file.name,
      color: '#EF4444',
    },
    {
      id: crypto.randomUUID(),
      title: `Review: ${baseName}`,
      date: addDays(base, offset2),
      type: 'task',
      description: `Action item automatically extracted from "${file.name}" via Claude AI document analysis.`,
      sourceFile: file.name,
      color: '#10B981',
    },
  ];
}

interface Props {
  onLogout: () => void;
}

export default function CalendarApp({ onLogout }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [droppedFiles, setDroppedFiles] = useState<DroppedFile[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handlePrevMonth = () => setCurrentDate(d => subMonths(d, 1));
  const handleNextMonth = () => setCurrentDate(d => addMonths(d, 1));

  const processFile = useCallback((fileEntry: DroppedFile) => {
    // pending → processing
    setTimeout(() => {
      setDroppedFiles(prev =>
        prev.map(f => f.id === fileEntry.id ? { ...f, status: 'processing' } : f),
      );

      // processing → completed
      const delay = 2200 + Math.random() * 1800;
      setTimeout(() => {
        const extracted = generateMockEvents(fileEntry);
        setDroppedFiles(prev =>
          prev.map(f =>
            f.id === fileEntry.id
              ? { ...f, status: 'completed', extractedEvents: extracted }
              : f,
          ),
        );
        setEvents(prev => [...prev, ...extracted]);
        // Navigate to the month of the first extracted event
        setCurrentDate(new Date(extracted[0].date.getFullYear(), extracted[0].date.getMonth(), 1));
      }, delay);
    }, 500);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: DroppedFile[] = acceptedFiles.map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending' as const,
        droppedAt: new Date(),
      }));
      setDroppedFiles(prev => [...newFiles, ...prev]);
      newFiles.forEach(processFile);
    },
    [processFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setSelectedEvent(null);
  };

  return (
    <div {...getRootProps()} className="h-screen flex flex-col bg-slate-50 relative select-none">
      <input {...getInputProps()} />

      {isDragActive && <FileDropOverlay />}

      <Header
        currentDate={currentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onLogout={onLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentDate={currentDate}
          events={events}
          droppedFiles={droppedFiles}
          onDateSelect={date => setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1))}
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
