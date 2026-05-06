import { Clock, Loader2, CheckCircle2, XCircle, FileText, FileSpreadsheet, Paperclip } from 'lucide-react';
import { clsx } from 'clsx';
import { DroppedFile, FileStatus } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  files: DroppedFile[];
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
  }
  if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
    return <FileText className="w-4 h-4 text-indigo-500" />;
  }
  return <Paperclip className="w-4 h-4 text-slate-400" />;
}

function StatusIcon({ status }: { status: FileStatus }) {
  switch (status) {
    case 'pending':
      return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    case 'processing':
      return <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />;
    case 'completed':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case 'error':
      return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
  }
}

function statusLabel(status: FileStatus, count?: number) {
  switch (status) {
    case 'pending': return 'Queued';
    case 'processing': return 'Analyzing with Claude...';
    case 'completed': return `${count ?? 0} events extracted`;
    case 'error': return 'Analysis failed';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileQueue({ files }: Props) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
        Document Analysis
      </h3>

      {files.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-5 text-center">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-2.5">
            <FileText className="w-5 h-5 text-indigo-300" />
          </div>
          <p className="text-xs font-medium text-slate-500">No documents yet</p>
          <p className="text-xs text-slate-400 mt-0.5">Drop files anywhere to begin</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              className={clsx(
                'p-3 rounded-xl border transition-colors',
                file.status === 'completed' ? 'border-emerald-100 bg-emerald-50/50' :
                file.status === 'processing' ? 'border-indigo-100 bg-indigo-50/50' :
                file.status === 'error' ? 'border-rose-100 bg-rose-50/50' :
                'border-slate-100 bg-slate-50/50',
              )}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5 flex-shrink-0">{fileIcon(file.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                </div>
                <StatusIcon status={file.status} />
              </div>
              <div className="mt-1.5 ml-6">
                <p className={clsx(
                  'text-xs',
                  file.status === 'completed' ? 'text-emerald-600' :
                  file.status === 'processing' ? 'text-indigo-500' :
                  file.status === 'error' ? 'text-rose-500' :
                  'text-slate-400',
                )}>
                  {statusLabel(file.status, file.extractedEvents?.length)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 px-3 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
        <p className="text-xs text-indigo-600 text-center leading-relaxed">
          Drop documents anywhere to extract dates & deadlines using Claude AI
        </p>
      </div>
    </div>
  );
}
