import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import { validateEvidenceFile } from '../../lib/validation';
import { uploadEvidenceFile } from '../../services/inspections';

interface EvidenceUploaderProps {
  onEvidenceUploaded: (url: string, filename: string) => void;
  existingUrl?: string;
  existingFilename?: string;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  onEvidenceUploaded,
  existingUrl,
  existingFilename,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(existingUrl);
  const [previewFilename, setPreviewFilename] = useState<string | undefined>(existingFilename);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validation = validateEvidenceFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file format or size exceeds 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      const result = await uploadEvidenceFile(file);
      setPreviewUrl(result.url);
      setPreviewFilename(result.filename);
      onEvidenceUploaded(result.url, result.filename);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo evidence.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setPreviewUrl(undefined);
    setPreviewFilename(undefined);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onEvidenceUploaded('', '');
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        capture="environment" // Mobile camera trigger
        className="hidden"
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <div className="relative inline-flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs">
          <ImageIcon className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="font-medium text-slate-800 truncate max-w-[200px]">
            {previewFilename || 'Evidence photo attached'}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-red-600 ml-1"
            title="Remove evidence"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-400 transition-colors cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-slate-500" />
          <span>{isUploading ? 'Uploading...' : 'Attach Photo Evidence'}</span>
        </button>
      )}

      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
};

