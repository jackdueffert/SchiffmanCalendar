import { clsx } from 'clsx';
import { CalendarEvent, EVENT_TYPE_CONFIG } from '../types';

interface Props {
  event: CalendarEvent;
  onClick: () => void;
}

export default function EventChip({ event, onClick }: Props) {
  const config = EVENT_TYPE_CONFIG[event.type];

  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      title={event.title}
      className={clsx(
        'w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate transition-opacity hover:opacity-80 leading-4',
        config.bg,
        config.text,
      )}
    >
      {event.title}
    </button>
  );
}
