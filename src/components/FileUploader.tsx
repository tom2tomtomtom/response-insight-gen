
import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useProcessing } from '../contexts/ProcessingContext';
import { Loader2, Upload } from 'lucide-react';

const FileUploader: React.FC = () => {
  const { handleFileUpload, isUploading } = useProcessing();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
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
          Drag and drop your Excel file or click to browse
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
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
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-3 rounded-full bg-muted">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <p className="text-muted-foreground text-sm">Uploading...</p>
              </div>
            ) : (
              <>
                <p className="font-medium">
                  Upload an Excel file containing your survey responses
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
          Supported formats: .xlsx, .xls
        </p>
      </CardFooter>
    </Card>
  );
};

export default FileUploader;
