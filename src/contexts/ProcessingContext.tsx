
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProcessedResult, UploadedFile, CodedResponse, CodeframeEntry, ApiConfig, ColumnInfo, UploadedCodeframe, ColumnSetting, ProjectContext } from '../types';
import { toast } from '../components/ui/use-toast';
import { 
  uploadFile, 
  processFile, 
  getProcessingResult, 
  generateExcelFile,
  testApiConnection, 
  setUserResponses,
  setApiSelectedColumns,
  setUploadedCodeframe,
  setColumnQuestionTypes as setApiColumnQuestionTypes
} from '../services/api';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

import { debugLog } from '../utils/debug';

export type QuestionType = 'brand_awareness' | 'brand_description' | 'miscellaneous';

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
  columnQuestionTypes: Record<number, QuestionType>;
  columnSettings: Record<number, ColumnSetting>;
  multipleCodeframes: Record<string, any> | null;
  insights: string | null;
  projectContext: ProjectContext | null;
  isRefinementMode: boolean;
  setApiConfig: (config: ApiConfig) => void;
  testApiConnection: (apiKey: string, apiUrl: string) => Promise<boolean>;
  handleFileUpload: (file: File) => Promise<void>;
  startProcessing: () => Promise<void>;
  downloadResults: () => Promise<void>;
  resetState: () => void;
  toggleColumnSelection: (columnIndex: number) => void;
  selectMultipleColumns: (columnIndices: number[], shouldSelect: boolean) => void;
  setSearchQuery: (query: string) => void;
  saveUploadedCodeframe: (codeframe: UploadedCodeframe) => void;
  setActiveCodeframe: (codeframe: UploadedCodeframe | null) => void;
  setColumnQuestionType: (columnIndex: number, questionType: string) => void;
  updateColumnSetting: (columnIndex: number, setting: keyof ColumnSetting, value: boolean) => void;
  setProjectContext: (context: ProjectContext | null) => void;
  toggleRefinementMode: () => void;
  refineCodeframe: (codeframe: CodeframeEntry[]) => Promise<void>;
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
  const [columnQuestionTypes, setColumnQuestionTypes] = useState<Record<number, QuestionType>>({});
  const [columnSettings, setColumnSettings] = useState<Record<number, ColumnSetting>>({});
  const [multipleCodeframes, setMultipleCodeframes] = useState<Record<string, any> | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [projectContext, setProjectContextState] = useState<ProjectContext | null>(null);
  const [isRefinementMode, setIsRefinementMode] = useState(false);

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
          debugLog("Reading Excel file data...");
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Debug available sheets
          debugLog("Available sheets:", workbook.SheetNames);
          
          if (workbook.SheetNames.length === 0) {
            reject(new Error('No worksheets found in the Excel file'));
            return;
          }
          
          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Debug worksheet structure
          debugLog("Worksheet range:", worksheet['!ref']);
          
          // Convert to JSON with header option
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: "" });
          
          debugLog("Excel rows found:", jsonData.length);
          
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
          
          debugLog(`Found ${columnInfos.length} columns, but none automatically selected`);
          
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
            debugLog("CSV parsing results:", results);
            
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
            
            debugLog(`Found ${columnInfos.length} columns, but none automatically selected`);
            
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

  // Set project context
  const setProjectContext = (context: ProjectContext | null) => {
    setProjectContextState(context);
  };

  // Toggle refinement mode
  const toggleRefinementMode = () => {
    setIsRefinementMode(prev => !prev);
  };

  // Refine codeframe
  const refineCodeframe = async (codeframe: CodeframeEntry[]) => {
    if (!results) return;
    
    try {
      setIsProcessing(true);
      setProcessingStatus('Refining codeframe...');
      
      // Update the results with the refined codeframe
      setResults({
        ...results,
        codeframe
      });
      
      toast({
        title: "Codeframe Refined",
        description: "Your codeframe has been successfully updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Refinement Failed",
        description: error instanceof Error ? error.message : "An error occurred during refinement",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Set column question type
  const setColumnQuestionType = (columnIndex: number, questionType: string) => {
    setColumnQuestionTypes(prev => ({
      ...prev,
      [columnIndex]: questionType as QuestionType
    }));
  };

  // Update column setting (like hasNets, isMultiResponse)
  const updateColumnSetting = (columnIndex: number, setting: keyof ColumnSetting, value: boolean) => {
    setColumnSettings(prev => ({
      ...prev,
      [columnIndex]: {
        ...(prev[columnIndex] || {}),
        [setting]: value
      }
    }));
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

  // Select or deselect multiple columns at once
  const selectMultipleColumns = (columnIndices: number[], shouldSelect: boolean) => {
    setSelectedColumns(prev => {
      if (shouldSelect) {
        // Add all columns that aren't already selected
        const newColumns = columnIndices.filter(idx => !prev.includes(idx));
        return [...prev, ...newColumns];
      } else {
        // Remove all specified columns
        return prev.filter(idx => !columnIndices.includes(idx));
      }
    });
  };

  // Save uploaded codeframe
  const saveUploadedCodeframe = (codeframe: UploadedCodeframe) => {
    setUploadedCodeframes(prev => [...prev, codeframe]);
    setActiveCodeframe(codeframe);
    setUploadedCodeframe(codeframe);
    
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
        debugLog("Parsing CSV file:", file.name);
        parseResult = await parseCSVFile(file);
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        debugLog("Parsing Excel file:", file.name);
        parseResult = await parseExcelFile(file);
      } else {
        throw new Error('Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      }
      
      const { columns, responses, rawData } = parseResult;
      
      debugLog("Total columns found:", columns.length);
      debugLog("Total text responses found:", responses.length);
      debugLog("Raw data rows:", rawData.length);
      
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

  // Start processing the uploaded file with multiple question types
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
      const selectedColumnsInfo = selectedColumns.map(index => {
        const columnInfo = fileColumns.find(col => col.index === index);
        if (columnInfo) {
          return {
            ...columnInfo,
            questionType: columnQuestionTypes[index] || 'miscellaneous',
            settings: columnSettings[index] || {}
          };
        }
        return null;
      }).filter(Boolean) as (ColumnInfo & { questionType: string, settings: ColumnSetting })[];
      
      // Call the API service function to store the column info
      setApiSelectedColumns(selectedColumnsInfo);
      
      // Send question types to API service
      setApiColumnQuestionTypes(columnQuestionTypes);
      
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

  // Poll for processing results with support for multiple codeframes
  const pollForResults = async (fileId: string) => {
    try {
      setProcessingStatus('Analyzing responses by question type...');
      setProcessingProgress(30);
      
      // Wait for a bit to simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProcessingStatus('Generating codeframes...');
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
      
      // Store multiple codeframes if available
      if (response.data.multipleCodeframes) {
        setMultipleCodeframes(response.data.multipleCodeframes);
      }
      
      // Store insights if available
      if (response.data.insights) {
        setInsights(response.data.insights);
      }
      
      setProcessingProgress(100);
      setProcessingStatus('Analysis complete!');
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${response.data.codedResponses.length} responses across ${Object.keys(columnQuestionTypes).length || 1} question types`,
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
    setFileColumns([]);
    setSelectedColumns([]);
    setSearchQuery('');
    setRawFileData(null);
    setMultipleCodeframes(null);
    setInsights(null);
    setProjectContextState(null);
    setIsRefinementMode(false);
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
    columnQuestionTypes,
    columnSettings,
    multipleCodeframes,
    insights,
    projectContext,
    isRefinementMode,
    setApiConfig,
    testApiConnection: handleTestApiConnection,
    handleFileUpload,
    startProcessing,
    downloadResults,
    resetState,
    toggleColumnSelection,
    selectMultipleColumns,
    setSearchQuery,
    saveUploadedCodeframe,
    setActiveCodeframe,
    setColumnQuestionType,
    updateColumnSetting,
    setProjectContext,
    toggleRefinementMode,
    refineCodeframe
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
