'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
}

interface ContextUploadProps {
  tankId: string;
}

export function ContextUpload({ tankId }: ContextUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
      uploadDate: new Date(),
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeIcon = (type: string) => {
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const acceptedFileTypes = ['application/pdf', 'text/plain', 'text/markdown', 'image/jpeg', 'image/png'];

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-slate-400" />
          <CardTitle className="text-slate-100">AI Context Upload</CardTitle>
        </div>
        <CardDescription className="text-slate-400">
          Upload documents, logs, or images to provide context for AI-powered maintenance insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
          }`}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
          <p className="text-sm text-slate-300 mb-2">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Supported formats: PDF, TXT, MD, JPG, PNG
          </p>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept={acceptedFileTypes.join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 cursor-pointer"
              asChild
            >
              <span>Select Files</span>
            </Button>
          </label>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-300">Uploaded Context Files</h3>
              <Badge className="bg-green-900/30 text-green-400 border-green-400/30">
                {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'}
              </Badge>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileTypeIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(file.size)} •{' '}
                        {file.uploadDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Message */}
        {uploadedFiles.length === 0 && (
          <div className="flex items-start gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
            <div className="text-xs text-slate-400">
              <p className="font-medium text-slate-300 mb-1">AI Context Upload</p>
              <p>
                Upload maintenance logs, technical documents, or images to enhance AI-powered maintenance
                predictions and recommendations. The AI will analyze uploaded context alongside real-time tank data.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

