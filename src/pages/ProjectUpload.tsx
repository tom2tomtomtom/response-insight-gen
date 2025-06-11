import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CleanLayout from '../components/CleanLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, ArrowRight, Upload, FileText, CheckCircle } from 'lucide-react';
import { toast } from '../components/ui/use-toast';
import * as XLSX from 'xlsx';

interface ColumnInfo {
  index: number;
  name: string;
  type: 'text' | 'numeric' | 'mixed' | 'empty';
  examples: string[];
  nonEmptyCount: number;
  totalCount: number;
}

const ProjectUpload: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [isProcessed, setIsProcessed] = useState(false);

  const analyzeColumns = (data: any[][]) => {
    if (data.length < 2) return [];

    const headers = data[0];
    const rows = data.slice(1);
    
    return headers.map((header, index) => {
      const columnData = rows.map(row => row[index]).filter(val => val != null && val !== '');
      const nonEmptyCount = columnData.length;
      const totalCount = rows.length;
      
      // Determine column type
      let type: 'text' | 'numeric' | 'mixed' | 'empty' = 'empty';
      if (nonEmptyCount > 0) {
        const numericCount = columnData.filter(val => !isNaN(Number(val))).length;
        const textCount = columnData.filter(val => isNaN(Number(val)) && String(val).trim().length > 0).length;
        
        if (textCount > numericCount) {
          type = 'text';
        } else if (numericCount > textCount) {
          type = 'numeric';
        } else if (numericCount > 0 && textCount > 0) {
          type = 'mixed';
        }
      }

      // Get examples
      const examples = columnData.slice(0, 3).map(val => String(val));

      return {
        index,
        name: String(header || `Column ${index + 1}`),
        type,
        examples,
        nonEmptyCount,
        totalCount
      };
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Check file size (warn if > 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Large file detected",
          description: "Files over 10MB may have limited functionality. Consider using a smaller sample.",
        });
      }
      setFile(selectedFile);
      setIsProcessed(false);
      setColumns([]);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      setIsProcessed(false);
      setColumns([]);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const processFile = async () => {
    if (!file || !projectId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Use backend API for file upload and processing
      const { default: apiClient } = await import('../services/apiClient');
      
      // Simulate progress updates during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await apiClient.uploadFile(projectId, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.data) {
        const { columns, totalRows, size } = result.data;
        setColumns(columns);
        
        setIsProcessed(true);
        toast({
          title: "File processed successfully",
          description: `Found ${columns.filter((col: any) => col.type === 'text').length} text columns ready for analysis. ${totalRows.toLocaleString()} rows processed.`,
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your file.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleNext = () => {
    if (!isProcessed) return;
    navigate(`/project/${projectId}/columns`);
  };

  const textColumns = columns.filter(col => col.type === 'text');

  return (
    <CleanLayout title="Upload Data" subtitle="Step 2 of 4: Data Upload">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900 mb-2">Upload your Excel file</p>
                  <p className="text-slate-600 mb-4">Drag and drop or click to browse</p>
                  <p className="text-sm text-slate-500">Supports .xlsx and .csv files</p>
                  <input
                    id="file-input"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                    <FileText className="h-6 w-6 text-slate-600" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{file.name}</p>
                      <p className="text-sm text-slate-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {isProcessed && <CheckCircle className="h-6 w-6 text-green-600" />}
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-sm text-slate-600 text-center">Processing file...</p>
                    </div>
                  )}

                  {!isProcessed && !isUploading && (
                    <Button onClick={processFile} className="w-full">
                      Process File
                    </Button>
                  )}

                  {isProcessed && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        File processed successfully! Found {textColumns.length} text columns ready for analysis.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isProcessed && columns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Column Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {textColumns.slice(0, 5).map((column) => (
                    <div key={column.index} className="p-3 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-slate-900">{column.name}</h4>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {column.nonEmptyCount} responses
                        </span>
                      </div>
                      <div className="text-sm text-slate-600">
                        Examples: {column.examples.join(', ')}
                      </div>
                    </div>
                  ))}
                  {textColumns.length > 5 && (
                    <p className="text-sm text-slate-500 text-center">
                      ...and {textColumns.length - 5} more text columns
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isProcessed && (
            <div className="flex justify-end">
              <Button onClick={handleNext}>
                Next: Select Columns
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </CleanLayout>
  );
};

export default ProjectUpload;