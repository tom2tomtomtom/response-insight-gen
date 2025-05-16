import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessedResult, UploadedFile, CodedResponse, CodeframeEntry, ApiConfig, ColumnInfo, UploadedCodeframe } from '../types';
import { toast } from '../components/ui/use-toast';
import { 
  uploadFile, 
  processFile, 
  getProcessingResult, 
  generateExcelFile,
  generateExcelWithOriginalData,
  testApiConnection, 
  setUserResponses,
  setApiSelectedColumns,
  setUploadedCodeframe as setApiUploadedCodeframe
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
  fileColumns: ColumnInfo[];
  selectedColumns: number[];
  searchQuery: string;
  uploadedCodeframes: UploadedCodeframe[];
  uploadedCodeframe: UploadedCodeframe | null;
  activeCodeframe: UploadedCodeframe | null;
  rawFileData: any[][] | null;
  setApiConfig: (config: ApiConfig) => void;
  testApiConnection: (apiKey: string, apiUrl: string) => Promise<boolean>;
  handleFileUpload: (file: File) => Promise<void>;
  startProcessing: () => Promise<void>;
  downloadResults: () => Promise<void>;
  downloadOriginalWithCodes: () => Promise<void>;
  resetState: () => void;
  toggleColumnSelection: (columnIndex: number) => void;
  setSearchQuery: (query: string) => void;
  saveUploadedCodeframe: (codeframe: UploadedCodeframe) => void;
  setActiveCodeframe: (codeframe: UploadedCodeframe | null) => void;
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
  const [fileColumns, setFileColumns] = useState<ColumnInfo[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedCodeframes, setUploadedCodeframes] = useState<UploadedCodeframe[]>([]);
  const [activeCodeframe, setActiveCodeframe] = useState<UploadedCodeframe | null>(null);
  const [rawFileData, setRawFileData] = useState<any[][] | null>(null);

  // Analyze a sample of values to determine column type and statistics
  const analyzeColumnValues = (values: any[]): { 
    type: 'text' | 'numeric' | 'mixed' | 'empty', 
    stats: { 
      textPercentage: number,
      numericPercentage: number,
      textLength: number,
      nonEmptyCount: number,
      totalCount: number
    } 
  } => {
    if (!values || values.length === 0) {
      return { 
        type: 'empty', 
        stats: { 
          textPercentage: 0, 
          numericPercentage: 0, 
          textLength: 0,
          nonEmptyCount: 0,
          totalCount: 0
        } 
      };
    }

    const totalCount = values.length;
    let textCount = 0;
    let numericCount = 0;
    let totalTextLength = 0;
    let nonEmptyCount = 0;

    // Analyze each value
    values.forEach(value => {
      // Skip empty values
      if (value === undefined || value === null || value === '') {
        return;
      }

      nonEmptyCount++;
      const strValue = String(value).trim();
      
      // Check if it's a number
      const isNumeric = !isNaN(Number(strValue)) && strValue !== '';
      
      if (isNumeric) {
        numericCount++;
      } else {
        textCount++;
        // Only count length for non-numeric values
        totalTextLength += strValue.length;
      }
    });

    const textPercentage = nonEmptyCount > 0 ? (textCount / nonEmptyCount) * 100 : 0;
    const numericPercentage = nonEmptyCount > 0 ? (numericCount / nonEmptyCount) * 100 : 0;
    const avgTextLength = textCount > 0 ? totalTextLength / textCount : 0;

    // Determine column type based on percentages
    let type: 'text' | 'numeric' | 'mixed' | 'empty' = 'empty';
    if (nonEmptyCount === 0) {
      type = 'empty';
    } else if (textPercentage > 90) {
      type = 'text';
    } else if (numericPercentage > 90) {
      type = 'numeric';
    } else {
      type = 'mixed';
    }

    // Additional heuristic: If average text length is high, consider it text regardless
    if (avgTextLength > 30 && textCount > 0) {
      type = 'text';
    }

    return {
      type,
      stats: {
        textPercentage,
        numericPercentage,
        textLength: avgTextLength,
        nonEmptyCount,
        totalCount
      }
    };
  };

  // Get column names from headers if available, otherwise generate placeholders
  const getColumnNames = (
    headers: string[] | null, 
    columnCount: number
  ): string[] => {
    if (headers && headers.length > 0) {
      return headers.map(header => header.trim() || 'Unnamed Column');
    }
    
    // Generate generic column names if no headers
    return Array(columnCount).fill(0).map((_, i) => `Column ${i + 1}`);
  };

  // Improved Excel file parsing
  const parseExcelFile = async (file: File): Promise<{ columns: ColumnInfo[], responses: string[], rawData: any[][] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          console.log("Reading Excel file data...");
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Debug available sheets
          console.log("Available sheets:", workbook.SheetNames);
          
          if (workbook.SheetNames.length === 0) {
            reject(new Error('No worksheets found in the Excel file'));
            return;
          }
          
          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Debug worksheet structure
          console.log("Worksheet range:", worksheet['!ref']);
          
          // Convert to JSON with header option
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: "" });
          
          console.log("Excel rows found:", jsonData.length);
          
          if (jsonData.length === 0) {
            reject(new Error('No data rows found in the Excel file'));
            return;
          }
          
          // Extract headers (first row)
          const headers = jsonData.length > 0 && Array.isArray(jsonData[0]) 
            ? jsonData[0].map(String)
            : null;
            
          // Determine if the first row looks like headers
          const hasHeaders = headers && headers.some(header => 
            typeof header === 'string' && 
            header.trim().length > 0 && 
            /^[A-Za-z\s_\-0-9?]+$/.test(header) // Simple regex to identify potential headers
          );
          
          // Extract data rows (skip header if it exists)
          const dataRows = hasHeaders ? jsonData.slice(1) : jsonData;
          
          // Store raw file data for later use - ensure rawData is an array of arrays
          const rawData: any[][] = [];
          if (hasHeaders && Array.isArray(jsonData[0])) {
            rawData.push(jsonData[0]);
          }
          if (Array.isArray(dataRows)) {
            dataRows.forEach(row => {
              if (Array.isArray(row)) {
                rawData.push(row);
              }
            });
          }
          
          // Transpose the data to get column-oriented arrays
          const columnCount = Math.max(...dataRows.map((row: any) => 
            Array.isArray(row) ? row.length : 0
          ));
          
          // Initialize column arrays
          const columns: any[][] = Array(columnCount).fill(0).map(() => []);
          
          // Fill the column arrays
          dataRows.forEach((row: any) => {
            if (Array.isArray(row)) {
              for (let i = 0; i < columnCount; i++) {
                if (i < row.length) {
                  columns[i].push(row[i]);
                } else {
                  columns[i].push("");
                }
              }
            }
          });
          
          // Get column names (from headers or generate placeholders)
          const columnNames = getColumnNames(
            hasHeaders ? headers : null, 
            columnCount
          );
          
          // Analyze each column
          const columnInfos: ColumnInfo[] = [];
          const textResponses: string[] = [];
          
          columns.forEach((columnData, index) => {
            const { type, stats } = analyzeColumnValues(columnData);
            
            // Include keywords that suggest open-ended questions
            const openEndedKeywords = ['comment', 'feedback', 'opinion', 'suggestion', 'describe', 'explain', 'tell', 'elaborate', 'why', 'how', 'open'];
            
            // Check if column name suggests it's an open-ended question
            let columnNameSuggestsOpenEnded = false;
            if (columnNames[index]) {
              const colNameLower = columnNames[index].toLowerCase();
              columnNameSuggestsOpenEnded = openEndedKeywords.some(keyword => 
                colNameLower.includes(keyword)
              );
            }
            
            // Get non-empty examples
            const examples = columnData
              .filter((value: any) => value !== undefined && value !== null && value !== '')
              .slice(0, 5)
              .map(String);
              
            columnInfos.push({
              index,
              name: columnNames[index],
              type: columnNameSuggestsOpenEnded && examples.length > 0 ? 'text' : type,
              examples,
              stats
            });
            
            // Collect text responses from text columns for backward compatibility
            if (type === 'text' || columnNameSuggestsOpenEnded) {
              const validResponses = columnData
                .filter((value: any) => 
                  value !== undefined && 
                  value !== null && 
                  value !== '' &&
                  String(value).trim().length > 5 // Only include substantive responses
                )
                .map(String);
                
              textResponses.push(...validResponses);
            }
          });
          
          // Remove auto-selection of columns - start with empty selection
          setSelectedColumns([]);
          
          console.log(`Found ${columnInfos.length} columns, but none automatically selected`);
          
          // Return both column info and text responses
          resolve({ 
            columns: columnInfos,
            responses: textResponses,
            rawData
          });
        } catch (error) {
          console.error("Excel parsing error:", error);
          reject(new Error(`Error parsing Excel file: ${error instanceof Error ? error.message : "Unknown error"}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // Improved CSV file parsing
  const parseCSVFile = async (file: File): Promise<{ columns: ColumnInfo[], responses: string[], rawData: any[][] }> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false, // We'll handle headers ourselves
        skipEmptyLines: true,
        complete: (results) => {
          try {
            console.log("CSV parsing results:", results);
            
            if (!results.data || results.data.length === 0) {
              reject(new Error('No data found in the CSV file'));
              return;
            }
            
            // Store raw file data for later use - ensure it's an array of arrays
            const rawData: any[][] = [];
            if (Array.isArray(results.data)) {
              results.data.forEach(row => {
                if (Array.isArray(row)) {
                  rawData.push(row);
                }
              });
            }
            
            // Check if the first row looks like headers
            const firstRow = results.data[0] as any[];
            const hasHeaders = firstRow.some(cell => 
              typeof cell === 'string' && 
              cell.trim().length > 0 && 
              /^[A-Za-z\s_\-0-9?]+$/.test(cell) // Simple regex to identify potential headers
            );
            
            // Extract headers and data rows
            const headers = hasHeaders ? firstRow.map(String) : null;
            const dataRows = hasHeaders ? results.data.slice(1) : results.data;
            
            // Get the maximum column count
            const columnCount = Math.max(...dataRows.map((row: any) => 
              Array.isArray(row) ? row.length : 0
            ));
            
            // Initialize column arrays
            const columns: any[][] = Array(columnCount).fill(0).map(() => []);
            
            // Fill the column arrays
            dataRows.forEach((row: any) => {
              if (Array.isArray(row)) {
                for (let i = 0; i < columnCount; i++) {
                  if (i < row.length) {
                    columns[i].push(row[i]);
                  } else {
                    columns[i].push("");
                  }
                }
              }
            });
            
            // Get column names from headers or generate placeholders
            const columnNames = getColumnNames(
              hasHeaders ? headers : null, 
              columnCount
            );
            
            // Analyze each column
            const columnInfos: ColumnInfo[] = [];
            const textResponses: string[] = [];
            
            columns.forEach((columnData, index) => {
              const { type, stats } = analyzeColumnValues(columnData);
              
              // Include keywords that suggest open-ended questions
              const openEndedKeywords = ['comment', 'feedback', 'opinion', 'suggestion', 'describe', 'explain', 'tell', 'elaborate', 'why', 'how', 'open'];
              
              // Check if column name suggests it's an open-ended question
              let columnNameSuggestsOpenEnded = false;
              if (columnNames[index]) {
                const colNameLower = columnNames[index].toLowerCase();
                columnNameSuggestsOpenEnded = openEndedKeywords.some(keyword => 
                  colNameLower.includes(keyword)
                );
              }
              
              // Get non-empty examples
              const examples = columnData
                .filter((value: any) => value !== undefined && value !== null && value !== '')
                .slice(0, 5)
                .map(String);
                
              columnInfos.push({
                index,
                name: columnNames[index],
                type: columnNameSuggestsOpenEnded && examples.length > 0 ? 'text' : type,
                examples,
                stats
              });
              
              // Collect text responses from text columns for backward compatibility
              if (type === 'text' || columnNameSuggestsOpenEnded) {
                const validResponses = columnData
                  .filter((value: any) => 
                    value !== undefined && 
                    value !== null && 
                    value !== '' &&
                    String(value).trim().length > 5 // Only include substantive responses
                  )
                  .map(String);
                  
                textResponses.push(...validResponses);
              }
            });
            
            // Remove auto-selection of columns - start with empty selection
            setSelectedColumns([]);
            
            console.log(`Found ${columnInfos.length} columns, but none automatically selected`);
            
            // Return both column info and text responses
            resolve({ 
              columns: columnInfos,
              responses: textResponses,
              rawData
            });
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

  // Toggle column selection
  const toggleColumnSelection = (columnIndex: number) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnIndex)) {
        return prev.filter(idx => idx !== columnIndex);
      } else {
        return [...prev, columnIndex];
      }
    });
  };

  // Save uploaded codeframe
  const saveUploadedCodeframe = (codeframe: UploadedCodeframe) => {
    setUploadedCodeframes(prev => [...prev, codeframe]);
    setActiveCodeframe(codeframe);
    setApiUploadedCodeframe(codeframe);
    
    toast({
      title: "Codeframe Saved",
      description: `"${codeframe.name}" with ${codeframe.entries.length} codes is now available for use.`
    });
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setProcessingStatus('Parsing file...');
      
      let parseResult: { columns: ColumnInfo[], responses: string[], rawData: any[][] };
      
      // Parse file based on type
      if (file.name.toLowerCase().endsWith('.csv')) {
        console.log("Parsing CSV file:", file.name);
        parseResult = await parseCSVFile(file);
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        console.log("Parsing Excel file:", file.name);
        parseResult = await parseExcelFile(file);
      } else {
        throw new Error('Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      }
      
      const { columns, responses, rawData } = parseResult;
      
      console.log("Total columns found:", columns.length);
      console.log("Total text responses found:", responses.length);
      console.log("Raw data rows:", rawData.length);
      
      setFileColumns(columns);
      setRawResponses(responses);
      setRawFileData(rawData);
      setUserResponses(responses);
      
      // Continue with the upload process
      setProcessingStatus('Uploading file...');
      
      const response = await uploadFile(file, apiConfig || undefined);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Upload failed');
      }
      
      setUploadedFile(response.data);
      
      if (columns.some(col => col.type === 'text')) {
        toast({
          title: "File Uploaded Successfully",
          description: `Found ${columns.filter(col => col.type === 'text').length} text response columns. Please select which to analyze.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "File Uploaded",
          description: "No text columns were automatically detected. Please manually select columns with text responses.",
        });
      }
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

    if (selectedColumns.length === 0) {
      toast({
        variant: "destructive",
        title: "No Columns Selected",
        description: "Please select at least one column to process",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStatus('Preparing selected columns...');
      setProcessingProgress(10);
      
      // Get the selected column info objects from fileColumns
      const selectedColumnsInfo = selectedColumns.map(index => 
        fileColumns.find(col => col.index === index)
      ).filter(Boolean) as ColumnInfo[];
      
      // Call the API service function to store the column info
      // We use a different name for the imported function to avoid confusion
      setApiSelectedColumns(selectedColumnsInfo);
      
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
        description: `Successfully analyzed ${response.data.codedResponses.length} responses from ${selectedColumns.length} columns`,
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

  // Generate and download Excel file with original data and codes
  const downloadOriginalWithCodes = async () => {
    if (!results || !rawFileData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No results or original data available to download",
      });
      return;
    }

    try {
      setIsGeneratingExcel(true);
      setProcessingStatus('Generating Excel with original data...');
      
      const excelBlob = await generateExcelWithOriginalData(results, rawFileData);
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(excelBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'survey_with_codes.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your Excel file with original data and codes is being downloaded",
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
    setFileColumns([]);
    setSelectedColumns([]);
    setSearchQuery('');
    setRawFileData(null);
    // Note: We don't reset the API config and uploaded codeframes on purpose
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
    fileColumns,
    selectedColumns,
    searchQuery,
    uploadedCodeframes,
    uploadedCodeframe: activeCodeframe,
    activeCodeframe,
    rawFileData,
    setApiConfig,
    testApiConnection: handleTestApiConnection,
    handleFileUpload,
    startProcessing,
    downloadResults,
    downloadOriginalWithCodes,
    resetState,
    toggleColumnSelection,
    setSearchQuery,
    saveUploadedCodeframe,
    setActiveCodeframe
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
