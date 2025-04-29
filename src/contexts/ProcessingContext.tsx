import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessedResult, UploadedFile, CodedResponse, CodeframeEntry, ApiConfig } from '../types';
import { toast } from '../components/ui/use-toast';
import { 
  uploadFile, 
  processFile, 
  getProcessingResult, 
  generateExcelFile, 
  testApiConnection, 
  setUserResponses 
} from '../services/api';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ProcessingContextType {
  uploadedFile: UploadedFile | null;
  isUploading: boolean;
  isProcessing: boolean;
  processingStatus: string;
  processingProgress: number;
  results: ProcessedResult | null;
  isGeneratingExcel: boolean;
  rawResponses: string[];
  apiConfig: ApiConfig | null;
  setApiConfig: (config: ApiConfig) => void;
  testApiConnection: (apiKey: string, apiUrl: string) => Promise<boolean>;
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
  const [rawResponses, setRawResponses] = useState<string[]>([]);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);

  // Parse Excel file and extract responses
  const parseExcelFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
          
          // Try to find response column - look for common names
          const possibleColumns = ['response', 'responses', 'verbatim', 'comment', 'feedback', 'answer', 'text'];
          let responseColumn = '';
          
          if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            const headers = Object.keys(firstRow);
            
            // Try to find a column that matches our expected response column names
            for (const column of headers) {
              if (possibleColumns.includes(column.toLowerCase())) {
                responseColumn = column;
                break;
              }
            }
            
            // If no match found, use the first text column
            if (!responseColumn && headers.length > 0) {
              responseColumn = headers[0];
            }
            
            if (responseColumn) {
              const responses = jsonData
                .map(row => row[responseColumn])
                .filter(response => typeof response === 'string' && response.trim() !== '');
              
              resolve(responses);
            } else {
              reject(new Error('Could not find a suitable response column'));
            }
          } else {
            reject(new Error('No data found in the Excel file'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // Parse CSV file and extract responses - IMPROVED VERSION
  const parseCSVFile = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            console.log("CSV parsing results:", results);
            
            if (results.data && results.data.length > 0) {
              // Debug what columns are available
              const firstRow = results.data[0] as Record<string, any>;
              console.log("CSV first row:", firstRow);
              
              const headers = Object.keys(firstRow);
              console.log("CSV headers:", headers);
              
              // Try to find response column - look for common names
              const possibleColumns = ['response', 'responses', 'verbatim', 'comment', 'feedback', 'answer', 'text', 'comments'];
              let responseColumn = '';
              
              // Try to find a column that matches our expected response column names
              for (const column of headers) {
                if (possibleColumns.includes(column.toLowerCase())) {
                  responseColumn = column;
                  break;
                }
              }
              
              // If no match found, use the first column that has text values
              if (!responseColumn && headers.length > 0) {
                // Try each column until we find one with text values
                for (const header of headers) {
                  const sampleValues = results.data
                    .slice(0, 5)
                    .map((row: any) => row[header])
                    .filter((val: any) => val !== undefined && val !== null && val !== "");
                  
                  if (sampleValues.length > 0) {
                    responseColumn = header;
                    break;
                  }
                }
                
                // If still no match, use the first header
                if (!responseColumn && headers.length > 0) {
                  responseColumn = headers[0];
                }
              }
              
              console.log("Selected response column:", responseColumn);
              
              if (responseColumn) {
                const responses = results.data
                  .map((row: any) => row[responseColumn])
                  .filter((response: any) => typeof response === 'string' && response.trim() !== '');
                
                console.log("Found responses:", responses.length);
                
                if (responses.length === 0) {
                  // If we didn't find valid responses in the selected column, try any non-empty string in any column
                  const allResponses: string[] = [];
                  
                  results.data.forEach((row: any) => {
                    for (const key of Object.keys(row)) {
                      const value = row[key];
                      if (typeof value === 'string' && value.trim() !== '') {
                        allResponses.push(value);
                      }
                    }
                  });
                  
                  console.log("Found alternative responses:", allResponses.length);
                  
                  if (allResponses.length > 0) {
                    resolve(allResponses);
                  } else {
                    reject(new Error('No valid responses found in the CSV file. Please check the format.'));
                  }
                } else {
                  resolve(responses);
                }
              } else {
                reject(new Error('Could not find a suitable response column in the CSV file.'));
              }
            } else {
              reject(new Error('No data found in the CSV file or file is empty.'));
            }
          } catch (error) {
            console.error("CSV parsing error:", error);
            reject(new Error(`Error parsing CSV: ${error instanceof Error ? error.message : "Unknown error"}`));
          }
        },
        error: (error) => {
          console.error("PapaParse error:", error);
          reject(new Error(`Error parsing CSV: ${error.message}`));
        }
      });
    });
  };

  // Test API connection
  const handleTestApiConnection = async (apiKey: string, apiUrl: string): Promise<boolean> => {
    try {
      await testApiConnection(apiKey, apiUrl);
      toast({
        title: "API Connection Successful",
        description: "Your API key has been verified and is working correctly.",
      });
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "API Connection Failed",
        description: error instanceof Error ? error.message : "Could not verify API key",
      });
      return false;
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setProcessingStatus('Parsing file...');
      
      let responses: string[] = [];
      
      // Parse file based on type
      if (file.name.toLowerCase().endsWith('.csv')) {
        console.log("Parsing CSV file:", file.name);
        responses = await parseCSVFile(file);
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        console.log("Parsing Excel file:", file.name);
        responses = await parseExcelFile(file);
      } else {
        throw new Error('Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      }
      
      console.log("Total responses found:", responses.length);
      
      if (responses.length === 0) {
        throw new Error('No valid responses found in the file. Please check the file format.');
      }
      
      setRawResponses(responses);
      setUserResponses(responses);
      
      // Continue with the upload process
      setProcessingStatus('Uploading file...');
      
      const response = await uploadFile(file, apiConfig || undefined);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Upload failed');
      }
      
      setUploadedFile(response.data);
      toast({
        title: "File Uploaded",
        description: `Successfully uploaded ${file.name} with ${responses.length} responses`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
      });
      resetState();
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
      
      const response = await processFile(uploadedFile.id, apiConfig || undefined);
      
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
      const response = await getProcessingResult(fileId, apiConfig || undefined);
      
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
    setRawResponses([]);
    // Note: We don't reset the API config on purpose
  };

  const value = {
    uploadedFile,
    isUploading,
    isProcessing,
    processingStatus,
    processingProgress,
    results,
    isGeneratingExcel,
    rawResponses,
    apiConfig,
    setApiConfig,
    testApiConnection: handleTestApiConnection,
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
