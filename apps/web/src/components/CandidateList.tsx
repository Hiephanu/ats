import { usePolling } from '../hooks/usePolling';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Clock, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Candidate {
  id: string;
  fullName: string;
  cvStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

interface CandidateListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function CandidateList({ selectedId, onSelect }: CandidateListProps) {
  // Poll every 5 seconds for the list
  const { data: candidates, error, isPolling } = usePolling<Candidate[]>('/api/cv/candidates', 5000);

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500">
        Failed to load candidates.
      </div>
    );
  }

  if (!candidates) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        No candidates uploaded yet.
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'PROCESSING': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'FAILED': return 'bg-red-50 text-red-700 border-red-200';
      case 'PROCESSING': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {candidates.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={cn(
            "w-full text-left p-4 flex items-start gap-4 transition-colors hover:bg-slate-50/80",
            selectedId === c.id ? "bg-blue-50/50" : ""
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
            selectedId === c.id ? "bg-blue-100 border-blue-200" : "bg-white border-slate-200"
          )}>
            <FileText className={cn("w-5 h-5", selectedId === c.id ? "text-blue-600" : "text-slate-400")} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-sm font-semibold text-slate-800 truncate">
                {c.fullName || 'Unknown Candidate'}
              </h3>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {new Date(c.createdAt).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                getStatusBg(c.cvStatus)
              )}>
                {getStatusIcon(c.cvStatus)}
                {c.cvStatus}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
