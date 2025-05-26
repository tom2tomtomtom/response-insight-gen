
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UploadedFile, ApiConfig, ColumnInfo, UploadedCodeframe, ColumnSetting, ProjectContext } from '../types';
import { toast } from '../components/ui/use-toast';
import { uploadFile, setUserResponses, setUploadedCodeframe } from '../services/api';
import { debugLog } from '../utils/debug';
import { ProcessingContextType, QuestionType } from './types';
import { useFileParsing } from '../hooks/useFileParsing';
import { useProcessingManagement } from '../hooks/useProcessingManagement';

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export const ProcessingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
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
  const [projectContext, setProjectContextState] = useState<ProjectContext | null>(null);
  const [isRefinementMode, setIsRefinementMode] = useState(false);

  const { isUploading, setIsUploading, parseExcelFile, parseCSVFile } = useFileParsing();
  const { 
    isProcessing, 
    processingStatus, 
    processingProgress, 
    results, 
    isGeneratingExcel, 
    multipleCodeframes, 
    insights,
    testApiConnection: handleTestApiConnection,
    startProcessing: handleStartProcessing,
    downloadResults,
    refineCodeframe,
    setProcessingStatus
  } = useProcessingManagement();

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setProcessingStatus('Parsing file...');
      
      let parseResult: { columns: ColumnInfo[], responses: string[], rawData: any[][] };
      
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

  const startProcessing = async () => {
    if (!uploadedFile) return;
    await handleStartProcessing(
      uploadedFile,
      selectedColumns,
      fileColumns,
      columnQuestionTypes,
      columnSettings,
      apiConfig
    );
  };

  const setProjectContext = (context: ProjectContext | null) => {
    setProjectContextState(context);
  };

  const toggleRefinementMode = () => {
    setIsRefinementMode(prev => !prev);
  };

  const setColumnQuestionType = (columnIndex: number, questionType: string) => {
    setColumnQuestionTypes(prev => ({
      ...prev,
      [columnIndex]: questionType as QuestionType
    }));
  };

  const updateColumnSetting = (columnIndex: number, setting: keyof ColumnSetting, value: boolean) => {
    setColumnSettings(prev => ({
      ...prev,
      [columnIndex]: {
        ...(prev[columnIndex] || {}),
        [setting]: value
      }
    }));
  };

  const toggleColumnSelection = (columnIndex: number) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnIndex)) {
        return prev.filter(idx => idx !== columnIndex);
      } else {
        return [...prev, columnIndex];
      }
    });
  };

  const selectMultipleColumns = (columnIndices: number[], shouldSelect: boolean) => {
    setSelectedColumns(prev => {
      if (shouldSelect) {
        const newColumns = columnIndices.filter(idx => !prev.includes(idx));
        return [...prev, ...newColumns];
      } else {
        return prev.filter(idx => !columnIndices.includes(idx));
      }
    });
  };

  const saveUploadedCodeframe = (codeframe: UploadedCodeframe) => {
    setUploadedCodeframes(prev => [...prev, codeframe]);
    setActiveCodeframe(codeframe);
    setUploadedCodeframe(codeframe);
    
    toast({
      title: "Codeframe Saved",
      description: `"${codeframe.name}" with ${codeframe.entries.length} codes is now available for use.`
    });
  };

  const resetState = () => {
    setUploadedFile(null);
    setIsUploading(false);
    setRawResponses([]);
    setFileColumns([]);
    setSelectedColumns([]);
    setSearchQuery('');
    setRawFileData(null);
    setProjectContextState(null);
    setIsRefinementMode(false);
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
