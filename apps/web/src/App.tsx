import { useState } from 'react';
import CvUpload from './components/CvUpload';
import CandidateList from './components/CandidateList';
import CvResult from './components/CvResult';

function App() {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const handleUploadSuccess = (candidateId: string) => {
    setSelectedCandidateId(candidateId);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">CV Processing Pipeline</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            System Online
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & List */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-semibold text-slate-800">Upload Resume</h2>
                <p className="text-sm text-slate-500 mt-1">Upload a PDF or Image to parse</p>
              </div>
              <div className="p-5">
                <CvUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col max-h-[600px]">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <h2 className="text-lg font-semibold text-slate-800">Recent Candidates</h2>
                <p className="text-sm text-slate-500 mt-1">Real-time processing status</p>
              </div>
              <div className="p-0 overflow-y-auto flex-1">
                <CandidateList 
                  selectedId={selectedCandidateId} 
                  onSelect={setSelectedCandidateId} 
                />
              </div>
            </section>
          </div>

          {/* Right Column: Result Details */}
          <div className="lg:col-span-8">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full min-h-[800px] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <h2 className="text-lg font-semibold text-slate-800">Extraction Results</h2>
                <p className="text-sm text-slate-500 mt-1">Parsed data and raw text</p>
              </div>
              <div className="flex-1 p-0 overflow-hidden bg-slate-50/30">
                <CvResult candidateId={selectedCandidateId} />
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
