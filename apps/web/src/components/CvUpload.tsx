import { useState, useRef } from 'react';
import { UploadCloud, FileType, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CvUploadProps {
  onUploadSuccess?: (candidateId: string) => void;
}

export default function CvUpload({ onUploadSuccess }: CvUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.match('application/pdf|image/*')) {
      setError('Please upload a PDF or Image file.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // We can also ask user for name/email, but for now just file
      formData.append('fullName', file.name.split('.')[0] || 'Unknown Candidate');

      const res = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const result = await res.json();
      if (onUploadSuccess) {
        onUploadSuccess(result.data.candidateId);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to upload. Ensure Match API is running.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div 
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out flex flex-col items-center justify-center gap-4 text-center cursor-pointer overflow-hidden bg-slate-50/50",
          isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-100/50",
          isUploading && "opacity-70 pointer-events-none"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const files = e.dataTransfer.files;
          if (files && files.length > 0) handleFile(files[0]);
        }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) handleFile(files[0]);
          }}
        />

        <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 mb-2">
          {isUploading ? (
             <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          ) : (
             <UploadCloud className="w-6 h-6 text-blue-500" />
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">
            {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
          </p>
          <p className="text-xs text-slate-500 mt-1">PDF, PNG, JPG up to 20MB</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
