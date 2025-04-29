
import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useProcessing } from '../contexts/ProcessingContext';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { toast } from './ui/use-toast';

const FileUploader: React.FC = () => {
  const { handleFileUpload, isUploading } = useProcessing();
  const [dragActive, setDragActive] = useState(false);
  const [dragError, setDragError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const validateFileType = (file: File): boolean => {
    const validTypes = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    return validTypes.includes(fileExtension);
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
      
      if (validateFileType(file)) {
        handleFileUpload(file);
      } else {
        setDragError(true);
        toast({
          variant: "destructive",
          title: "Invalid File Format",
          description: "Please upload an Excel (.xlsx, .xls) or CSV (.csv) file."
        });
        setTimeout(() => setDragError(false), 3000);
      }
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (validateFileType(file)) {
        handleFileUpload(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Format",
          description: "Please upload an Excel (.xlsx, .xls) or CSV (.csv) file."
        });
      }
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
            <div className={`p-3 rounded-full ${dragError ? 'bg-destructive/10' : 'bg-muted'}`}>
              {dragError ? (
                <AlertCircle className="h-8 w-8 text-destructive" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Uploading...</p>
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
                  File should include a column with open-ended responses
                </p>
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
