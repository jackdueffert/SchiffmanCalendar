export type EventType = 'deadline' | 'meeting' | 'task' | 'reminder';
export type FileStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: EventType;
  description?: string;
  sourceFile?: string;
  color: string;
}

export interface DroppedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: FileStatus;
  droppedAt: Date;
  extractedEvents?: CalendarEvent[];
}

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; bg: string; text: string; light: string; dot: string }> = {
  deadline: {
    label: 'Deadline',
    bg: 'bg-rose-500',
    text: 'text-white',
    light: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  meeting: {
    label: 'Meeting',
    bg: 'bg-blue-500',
    text: 'text-white',
    light: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  task: {
    label: 'Task',
    bg: 'bg-emerald-500',
    text: 'text-white',
    light: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  reminder: {
    label: 'Reminder',
    bg: 'bg-amber-400',
    text: 'text-white',
    light: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
};
