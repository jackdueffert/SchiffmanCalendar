import { CloudUpload, FileText } from 'lucide-react';

export default function FileDropOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/80 backdrop-blur-sm animate-fade-in" />
      <div className="relative flex flex-col items-center gap-4 animate-fade-in-up">
        <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center shadow-lg">
          <CloudUpload className="w-10 h-10 text-indigo-600" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-indigo-700">Drop to Analyze</p>
          <p className="text-sm text-indigo-500 mt-1">Claude AI will extract dates and deadlines</p>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {['.pdf', '.docx', '.doc', '.xlsx', '.xls'].map(ext => (
              <span key={ext} className="px-2 py-0.5 bg-white border border-indigo-200 rounded-full text-xs font-medium text-indigo-600 shadow-sm">
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
