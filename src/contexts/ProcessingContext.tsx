
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessedResult, UploadedFile } from '../types';
import { toast } from '../components/ui/use-toast';
import { uploadFile, processFile, getProcessingResult, generateExcelFile } from '../services/api';

interface ProcessingContextType {
  uploadedFile: UploadedFile | null;
  isUploading: boolean;
  isProcessing: boolean;
  processingStatus: string;
  processingProgress: number;
  results: ProcessedResult | null;
  isGeneratingExcel: boolean;
  handleFileUpload: (file: File) => Promise<void>;
  startProcessing: () => Promise<void>;
  downloadResults: () => Promise<void>;
  resetState: () => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export const ProcessingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<ProcessedResult | null>(null);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setProcessingStatus('Uploading file...');
      
      const response = await uploadFile(file);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Upload failed');
      }
      
      setUploadedFile(response.data);
      toast({
        title: "File Uploaded",
        description: `Successfully uploaded ${file.name}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Start processing the uploaded file
  const startProcessing = async () => {
    if (!uploadedFile || !uploadedFile.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No file has been uploaded",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus('Starting analysis...');
      setProcessingProgress(10);
      
      const response = await processFile(uploadedFile.id);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Processing failed to start');
      }
      
      setUploadedFile(response.data);
      
      // Start polling for results
      await pollForResults(uploadedFile.id);
    } catch (error) {
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An error occurred during processing",
      });
    }
  };

  // Poll for processing results
  const pollForResults = async (fileId: string) => {
    try {
      setProcessingStatus('Analyzing responses...');
      setProcessingProgress(30);
      
      // Wait for a bit to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProcessingStatus('Generating codeframe...');
      setProcessingProgress(60);
      
      // Wait again to simulate the next processing step
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProcessingStatus('Mapping responses to codes...');
      setProcessingProgress(80);
      
      // Final wait before getting results
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get the actual results
      const response = await getProcessingResult(fileId);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to retrieve results');
      }
      
      setResults(response.data);
      setProcessingProgress(100);
      setProcessingStatus('Analysis complete!');
      
      toast({
        title: "Analysis Complete",
        description: "Your survey responses have been processed successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: error instanceof Error ? error.message : "An error occurred while retrieving results",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate and download Excel file
  const downloadResults = async () => {
    if (!results) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No results available to download",
      });
      return;
    }

    try {
      setIsGeneratingExcel(true);
      setProcessingStatus('Generating Excel file...');
      
      const excelBlob = await generateExcelFile(results);
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(excelBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'coded_responses.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your Excel file is being downloaded",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error instanceof Error ? error.message : "An error occurred while generating the Excel file",
      });
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  // Reset the entire state
  const resetState = () => {
    setUploadedFile(null);
    setIsUploading(false);
    setIsProcessing(false);
    setProcessingStatus('');
    setProcessingProgress(0);
    setResults(null);
    setIsGeneratingExcel(false);
  };

  const value = {
    uploadedFile,
    isUploading,
    isProcessing,
    processingStatus,
    processingProgress,
    results,
    isGeneratingExcel,
    handleFileUpload,
    startProcessing,
    downloadResults,
    resetState
  };

  return (
    <ProcessingContext.Provider value={value}>
      {children}
    </ProcessingContext.Provider>
  );
};

export const useProcessing = (): ProcessingContextType => {
  const context = useContext(ProcessingContext);
  
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  
  return context;
};
