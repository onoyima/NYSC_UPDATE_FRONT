'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface DocxImportFormProps {
  onUploadSuccess: (sessionId: string, summary: ImportSummary) => void;
  onUploadError: (error: string) => void;
}

interface ImportSummary {
  total_extracted: number;
  total_matched: number;
  ready_for_review: number;
}

const DocxImportForm: React.FC<DocxImportFormProps> = ({ onUploadSuccess, onUploadError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.docx')) {
        setError('Please select a valid .docx file');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('docx_file', selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      console.log('Uploading file:', selectedFile.name, 'Size:', selectedFile.size);
      
      const response = await fetch('/api/nysc/admin/docx-import/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('nysc_token')}`,
        },
        body: formData,
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      clearInterval(progressInterval);
      setUploadProgress(100);

      let result;
      const responseText = await response.text();
      
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        // If we can't parse JSON, it means we got an HTML error page
        console.error('Server returned HTML instead of JSON:', responseText);
        throw new Error(`Server error (${response.status}): Unable to process request. Check server logs.`);
      }

      if (!response.ok) {
        throw new Error(result.message || `Upload failed with status ${response.status}`);
      }

      if (result.success) {
        toast.success('File uploaded and processed successfully!');
        onUploadSuccess(result.session_id, result.summary);
        
        // Reset form
        setSelectedFile(null);
        setUploadProgress(0);
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      onUploadError(errorMessage);
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload DOCX File
        </CardTitle>
        <CardDescription>
          Upload a Word document (.docx) containing matriculation numbers and their corresponding Class of Degree information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the file here...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  Drag & drop a DOCX file here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Maximum file size: 10MB
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading and processing...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="min-w-[120px]"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Process
              </>
            )}
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">File Format Requirements:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• File must be in .docx format (Microsoft Word)</li>
            <li>• Should contain matriculation numbers and Class of Degree information</li>
            <li>• Supported formats: tables or paragraph text</li>
            <li>• Valid Class of Degree values: First Class, Second Class Upper, Second Class Lower, Third Class, Pass</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocxImportForm;