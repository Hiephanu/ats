import { usePolling } from '../hooks/usePolling';
import { Loader2, FileText, Code2, ExternalLink } from 'lucide-react';

interface CandidateDetail {
  id: string;
  fullName: string;
  cvStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  cvFileUrl: string | null;
  rawCvText: string | null;
  parsedData: any;
}

export default function CvResult({ candidateId }: { candidateId: string | null }) {
  // Poll candidate detail until status is COMPLETED or FAILED
  const { data: candidate, error, isPolling } = usePolling<CandidateDetail>(
    candidateId ? `/api/cv/candidates/${candidateId}` : '',
    3000,
    (data) => data.cvStatus === 'COMPLETED' || data.cvStatus === 'FAILED'
  );

  if (!candidateId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
        <FileText className="w-12 h-12 mb-4 opacity-20" />
        <p>Select a candidate from the list to view results</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Failed to load candidate details.
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p>Fetching candidate data...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Header Info */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{candidate.fullName || 'Unknown Candidate'}</h2>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="text-slate-500">Status:</span>
            <span className="font-medium text-slate-700">{candidate.cvStatus}</span>
            {isPolling && candidate.cvStatus !== 'COMPLETED' && candidate.cvStatus !== 'FAILED' && (
               <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 inline-block ml-1" />
            )}
          </div>
        </div>
        {candidate.cvFileUrl && (
          <a 
            href={candidate.cvFileUrl} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-blue-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            View Original PDF
          </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {candidate.cvStatus === 'PENDING' || candidate.cvStatus === 'PROCESSING' ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
             <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
             <p>Processing CV through OCR and AI Pipeline...</p>
             <p className="text-xs text-slate-400 mt-2">This usually takes a few seconds.</p>
          </div>
        ) : candidate.cvStatus === 'FAILED' ? (
          <div className="p-6 bg-red-50 rounded-xl border border-red-100">
            <h3 className="text-red-800 font-semibold mb-2">Processing Failed</h3>
            <pre className="text-sm text-red-600 whitespace-pre-wrap font-mono bg-red-100/50 p-4 rounded-lg">
              {JSON.stringify(candidate.parsedData?.error || 'Unknown error', null, 2)}
            </pre>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
            {/* Parsed JSON Panel */}
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center gap-2 text-slate-200">
                <Code2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold tracking-wide">Structured Data</span>
              </div>
              <div className="flex-1 bg-slate-900 p-4 overflow-y-auto">
                <pre className="text-sm text-emerald-400 font-mono whitespace-pre-wrap">
                  {candidate.parsedData ? JSON.stringify(candidate.parsedData, null, 2) : '{}'}
                </pre>
              </div>
            </div>

            {/* Raw Text Panel */}
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-slate-700">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold tracking-wide">Raw OCR Text</span>
              </div>
              <div className="flex-1 bg-white p-4 overflow-y-auto">
                <p className="text-sm text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                  {candidate.rawCvText || 'No text extracted.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
