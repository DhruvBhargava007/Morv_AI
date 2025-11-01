'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HealthFileUploadProps {
  tankId: string;
  onUploadComplete?: (jobId: string, category: string) => void;
}

interface UploadResult {
  job_id: string;
  detected_category: string;
  filename: string;
  rows: number;
  columns: string[];
  status: string;
}

export function HealthFileUpload({ tankId, onUploadComplete }: HealthFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const VALID_CATEGORIES = ['maintenance', 'risk', 'priority', 'usage', 'sensors', 'logs'];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file (.csv extension required)');
      setUploadResult(null);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError(`File size exceeds maximum limit of 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      setUploadResult(null);
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/health/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Upload failed');
        setUploadResult(null);
        return;
      }

      // Check if category is valid
      if (!VALID_CATEGORIES.includes(data.detected_category)) {
        setError(
          `CSV doesn't match any valid category. Detected columns: ${data.detected_columns?.join(', ') || 'unknown'}. ` +
          `Accepted categories: ${VALID_CATEGORIES.join(', ')}`
        );
        setUploadResult(null);
        return;
      }

      setUploadResult(data);
      
      // Trigger recalculation
      if (onUploadComplete) {
        onUploadComplete(data.job_id, data.detected_category);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadResult(null);
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      maintenance: 'Maintenance',
      risk: 'Risk',
      priority: 'Priority',
      usage: 'Usage',
      sensors: 'Sensors',
      logs: 'Logs',
    };
    return labels[category] || category;
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        onClick={handleButtonClick}
        disabled={uploading}
        size="sm"
        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </>
        )}
      </Button>

      {uploadResult && (
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800/50 text-slate-300 border-slate-700/50">
            <FileText className="w-3 h-3 mr-1" />
            {getCategoryLabel(uploadResult.detected_category)}
          </Badge>
          <CheckCircle2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">
            {uploadResult.rows} rows
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500 max-w-xs truncate">{error}</span>
        </div>
      )}
    </div>
  );
}

