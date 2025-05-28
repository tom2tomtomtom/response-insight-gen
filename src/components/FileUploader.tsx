import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useProcessing } from '../contexts/ProcessingContext';
import { Loader2, Upload, AlertCircle, FileQuestion, Info } from 'lucide-react';
import { toast } from './ui/use-toast';
import UploadSuccessCard from './UploadSuccessCard';

const FileUploader: React.FC = () => {
  const { handleFileUpload, isUploading, uploadedFile, fileColumns } = useProcessing();
  const [dragActive, setDragActive] = useState(false);
  const [dragError, setDragError] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show success card if file is uploaded and columns are available
  if (uploadedFile && fileColumns && fileColumns.length > 0) {
    return <UploadSuccessCard />;
  }
  
  const validateFileType = (file: File): boolean => {
    const validTypes = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    return validTypes.includes(fileExtension);
  };

  const processSelectedFile = (file: File, onInvalid?: () => void) => {
    setFileName(file.name);

    if (validateFileType(file)) {
      toast({
        title: 'File Accepted',
        description: `Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      });
      handleFileUpload(file);
    } else {
      onInvalid?.();
      toast({
        variant: 'destructive',
        title: 'Invalid File Format',
        description: 'Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.',
      });
    }
  };
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setDragError(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processSelectedFile(file, () => {
        setDragError(true);
        setTimeout(() => setDragError(false), 3000);
      });
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processSelectedFile(file);
    }
  };
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Survey Responses</CardTitle>
        <CardDescription>
          Drag and drop your Excel or CSV file or click to browse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragError ? 'border-destructive bg-destructive/5' : 
            dragActive ? 'border-primary bg-primary/5' : 'border-muted'
          } transition-colors duration-200 cursor-pointer`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <input 
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`p-3 rounded-full ${dragError ? 'bg-destructive/10' : isUploading && fileName ? 'bg-amber-100' : 'bg-muted'}`}>
              {dragError ? (
                <AlertCircle className="h-8 w-8 text-destructive" />
              ) : isUploading && fileName ? (
                <FileQuestion className="h-8 w-8 text-amber-600" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Analyzing {fileName}...</p>
                <p className="text-xs text-muted-foreground">This may take a moment for large files</p>
              </div>
            ) : dragError ? (
              <>
                <p className="font-medium text-destructive">
                  Invalid file format
                </p>
                <p className="text-sm text-muted-foreground">
                  Please upload an Excel (.xlsx, .xls) or CSV (.csv) file
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">
                  Upload an Excel or CSV file containing your survey responses
                </p>
                <p className="text-sm text-muted-foreground">
                  You'll be able to select specific columns with open-ended responses
                </p>
                <div className="mt-2 text-xs text-muted-foreground p-2 bg-gray-50 rounded border border-gray-100">
                  <p className="font-semibold mb-1">Tips for successful uploads:</p>
                  <ul className="list-disc list-inside space-y-1 text-left">
                    <li>Files with mixed numeric and text data are supported</li>
                    <li>You'll be prompted to select columns with open-ended responses</li>
                    <li>Column headers help identify question types</li>
                    <li>Remove empty rows at the beginning of your file</li>
                  </ul>
                </div>
                <div className="mt-2 flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-100">
                  <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <p className="text-xs text-blue-700 text-left">
                    <strong>New!</strong> Our improved column detection automatically identifies open-ended questions in your data
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-xs text-muted-foreground">
          Supported formats: .xlsx, .xls, .csv
        </p>
      </CardFooter>
    </Card>
  );
};

export default FileUploader;
