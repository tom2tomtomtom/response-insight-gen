import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UploadedFile, ApiConfig, ColumnInfo, UploadedCodeframe, ColumnSetting, ProjectContext, CodeframeGenerationRules, TrackingStudyConfig, ColumnQuestionConfig, BrandEntry } from '../types';
import { toast } from '../components/ui/use-toast';
import { uploadFile, setUserResponses, setUploadedCodeframe } from '../services/api';
import { debugLog } from '../utils/debug';
import { ProcessingContextType, QuestionType } from './types';
import { useFileParsing } from '../hooks/useFileParsing';
import { useProcessingManagement } from '../hooks/useProcessingManagement';

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

// Session storage keys
const STORAGE_KEYS = {
  PROJECT_CONTEXT: 'response-insight-project-context',
  CODEFRAME_RULES: 'response-insight-codeframe-rules',
  TRACKING_CONFIG: 'response-insight-tracking-config',
  BRAND_LIST: 'response-insight-brand-list',
  UPLOADED_CODEFRAMES: 'response-insight-uploaded-codeframes',
  API_CONFIG: 'response-insight-api-config',
  COMPLETE_STATE: 'response-insight-complete-state',
  SELECTED_COLUMNS: 'response-insight-selected-columns',
  COLUMN_CONFIGS: 'response-insight-column-configs'
};

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
  
  // New state for enhanced features
  const [codeframeRules, setCodeframeRules] = useState<CodeframeGenerationRules>({
    minimumPercentage: 3,
    includeCatchalls: true,
    useNumericIds: true,
    enforceThresholds: true
  });
  const [trackingConfig, setTrackingConfig] = useState<TrackingStudyConfig>({
    isPriorCodeframe: false,
    waveNumber: 1
  });
  const [isCodeframeFinalized, setIsCodeframeFinalized] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [columnQuestionConfigs, setColumnQuestionConfigs] = useState<Record<number, ColumnQuestionConfig>>({});
  const [brandList, setBrandList] = useState<BrandEntry[]>([]);

  // Load persisted data on mount
  useEffect(() => {
    try {
      // Load project context
      const savedProjectContext = localStorage.getItem(STORAGE_KEYS.PROJECT_CONTEXT);
      if (savedProjectContext) {
        setProjectContextState(JSON.parse(savedProjectContext));
      }

      // Load codeframe rules
      const savedCodeframeRules = localStorage.getItem(STORAGE_KEYS.CODEFRAME_RULES);
      if (savedCodeframeRules) {
        setCodeframeRules(JSON.parse(savedCodeframeRules));
      }

      // Load tracking config
      const savedTrackingConfig = localStorage.getItem(STORAGE_KEYS.TRACKING_CONFIG);
      if (savedTrackingConfig) {
        setTrackingConfig(JSON.parse(savedTrackingConfig));
      }

      // Load brand list
      const savedBrandList = localStorage.getItem(STORAGE_KEYS.BRAND_LIST);
      if (savedBrandList) {
        setBrandList(JSON.parse(savedBrandList));
      }

      // Load uploaded codeframes
      const savedCodeframes = localStorage.getItem(STORAGE_KEYS.UPLOADED_CODEFRAMES);
      if (savedCodeframes) {
        setUploadedCodeframes(JSON.parse(savedCodeframes));
      }

      // Load API config (but not the API key for security)
      const savedApiConfig = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
      if (savedApiConfig) {
        const config = JSON.parse(savedApiConfig);
        // Only restore non-sensitive parts
        setApiConfig({ ...config, apiKey: '' });
      }

      // Load selected columns
      const savedSelectedColumns = localStorage.getItem(STORAGE_KEYS.SELECTED_COLUMNS);
      if (savedSelectedColumns) {
        setSelectedColumns(JSON.parse(savedSelectedColumns));
      }

      // Load column configs
      const savedColumnConfigs = localStorage.getItem(STORAGE_KEYS.COLUMN_CONFIGS);
      if (savedColumnConfigs) {
        setColumnQuestionConfigs(JSON.parse(savedColumnConfigs));
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  }, []);

  // Persist project context changes
  useEffect(() => {
    if (projectContext) {
      localStorage.setItem(STORAGE_KEYS.PROJECT_CONTEXT, JSON.stringify(projectContext));
    }
  }, [projectContext]);

  // Persist codeframe rules changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CODEFRAME_RULES, JSON.stringify(codeframeRules));
  }, [codeframeRules]);

  // Persist tracking config changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRACKING_CONFIG, JSON.stringify(trackingConfig));
  }, [trackingConfig]);

  // Persist brand list changes
  useEffect(() => {
    if (brandList.length > 0) {
      localStorage.setItem(STORAGE_KEYS.BRAND_LIST, JSON.stringify(brandList));
    }
  }, [brandList]);

  // Persist uploaded codeframes changes
  useEffect(() => {
    if (uploadedCodeframes.length > 0) {
      localStorage.setItem(STORAGE_KEYS.UPLOADED_CODEFRAMES, JSON.stringify(uploadedCodeframes));
    }
  }, [uploadedCodeframes]);

  // Persist selected columns
  useEffect(() => {
    if (selectedColumns.length > 0) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_COLUMNS, JSON.stringify(selectedColumns));
    }
  }, [selectedColumns]);

  // Persist column configs
  useEffect(() => {
    if (Object.keys(columnQuestionConfigs).length > 0) {
      localStorage.setItem(STORAGE_KEYS.COLUMN_CONFIGS, JSON.stringify(columnQuestionConfigs));
    }
  }, [columnQuestionConfigs]);

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
    setProcessingStatus,
    downloadMoniglewCSV: handleDownloadMoniglewCSV
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

  const startProcessing = async (options?: { applyToFullDataset?: boolean }) => {
    if (!uploadedFile) return;
    await handleStartProcessing(
      uploadedFile,
      selectedColumns,
      fileColumns,
      columnQuestionTypes,
      columnSettings,
      apiConfig,
      options
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

  const setColumnQuestionConfig = (columnIndex: number, config: ColumnQuestionConfig) => {
    setColumnQuestionConfigs(prev => ({
      ...prev,
      [columnIndex]: config
    }));
    
    // Also update the question type for backward compatibility
    setColumnQuestionTypes(prev => ({
      ...prev,
      [columnIndex]: config.questionType as QuestionType
    }));
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
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

  const saveBrandList = (brands: BrandEntry[]) => {
    setBrandList(brands);
    toast({
      title: "Brand List Saved",
      description: `${brands.length} brands configured for normalization.`
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
    setIsCodeframeFinalized(false);
    setHasUnsavedChanges(false);
    setColumnQuestionConfigs({});
    setBrandList([]);
    
    // Clear persisted data when resetting
    localStorage.removeItem(STORAGE_KEYS.PROJECT_CONTEXT);
    localStorage.removeItem(STORAGE_KEYS.BRAND_LIST);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_COLUMNS);
    localStorage.removeItem(STORAGE_KEYS.COLUMN_CONFIGS);
    localStorage.removeItem(STORAGE_KEYS.UPLOADED_CODEFRAMES);
    // Keep codeframe rules and tracking config as they are reusable
  };

  const finalizeCodeframe = () => {
    setIsCodeframeFinalized(true);
    setHasUnsavedChanges(false);
    toast({
      title: "Codeframe Finalized",
      description: "Your codeframe is now locked and ready for full dataset application."
    });
  };

  const unlockCodeframe = () => {
    setIsCodeframeFinalized(false);
    toast({
      title: "Codeframe Unlocked",
      description: "You can now edit and reprocess the codeframe."
    });
  };

  const saveChanges = () => {
    setHasUnsavedChanges(false);
    toast({
      title: "Changes Saved",
      description: "Your edits have been saved successfully."
    });
  };

  const reprocessWithAI = async (revisionInstructions?: string) => {
    if (!results || !apiConfig?.apiKey) return;
    
    try {
      setProcessingStatus('Reprocessing with AI incorporating your edits...');
      
      // Create a prompt that includes the current codeframe and revision instructions
      const reprocessPrompt = `I have an existing codeframe with manual edits. Please reprocess the responses using this updated codeframe.
      
      Current Codeframe (with manual edits):
      ${JSON.stringify(results.codeframe, null, 2)}
      
      ${revisionInstructions ? `Revision Instructions: ${revisionInstructions}` : 'Apply the manual edits shown in the codeframe above.'}
      
      Original Responses to recode:
      ${JSON.stringify(results.codedResponses.map(r => ({
        responseText: r.responseText,
        columnName: r.columnName,
        rowIndex: r.rowIndex
      })), null, 2)}
      
      Please:
      1. Use the updated codeframe structure exactly as provided
      2. Recode all responses according to the new codeframe
      3. Ensure all responses are assigned appropriate codes
      4. Return the same JSON structure with updated codesAssigned arrays`;
      
      const response = await fetch(`${apiConfig.apiUrl || "https://api.openai.com/v1/chat/completions"}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert qualitative researcher. Apply the provided codeframe to recode responses, following any manual edits or revision instructions exactly."
            },
            {
              role: "user",
              content: reprocessPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const reprocessedData = JSON.parse(data.choices[0].message.content);
      
      // Update results with reprocessed data
      const updatedResults = {
        ...results,
        codedResponses: reprocessedData.codedResponses || results.codedResponses,
        codeframe: results.codeframe // Keep the manually edited codeframe
      };
      
      // Use refineCodeframe to update the results
      refineCodeframe(updatedResults);
      
      setProcessingStatus('');
      setHasUnsavedChanges(false);
      
      toast({
        title: "Reprocessing Complete",
        description: "AI has recoded all responses using your edited codeframe."
      });
    } catch (error) {
      console.error('Reprocessing error:', error);
      setProcessingStatus('');
      toast({
        variant: "destructive",
        title: "Reprocessing Failed",
        description: error instanceof Error ? error.message : "An error occurred during reprocessing."
      });
    }
  };

  const applyToFullDataset = async () => {
    if (!results || !isCodeframeFinalized || !apiConfig?.apiKey) {
      toast({
        variant: "destructive",
        title: "Cannot Apply",
        description: !apiConfig?.apiKey ? "Please configure API key first." : "Please finalize the codeframe first."
      });
      return;
    }

    try {
      setProcessingStatus('Applying finalized codeframe to full dataset...');
      
      // Get all text responses from the raw data
      const allResponses: Array<{text: string, rowIndex: number, columnIndex: number, columnName: string}> = [];
      
      if (rawFileData && selectedColumns.length > 0) {
        // Skip header row
        for (let rowIndex = 1; rowIndex < rawFileData.length; rowIndex++) {
          const row = rawFileData[rowIndex];
          
          for (const colIndex of selectedColumns) {
            const cellValue = row[colIndex];
            if (cellValue && String(cellValue).trim()) {
              allResponses.push({
                text: String(cellValue).trim(),
                rowIndex,
                columnIndex: colIndex,
                columnName: fileColumns[colIndex]?.name || `Column ${colIndex + 1}`
              });
            }
          }
        }
      }
      
      setProcessingStatus(`Processing ${allResponses.length} responses with finalized codeframe...`);
      
      // Process in batches to avoid overwhelming the API
      const BATCH_SIZE = 100;
      const processedResponses: any[] = [];
      
      for (let i = 0; i < allResponses.length; i += BATCH_SIZE) {
        const batch = allResponses.slice(i, i + BATCH_SIZE);
        const progress = Math.round((i / allResponses.length) * 100);
        setProcessingStatus(`Processing responses: ${progress}% complete...`);
        
        try {
          // Create prompt for batch coding with the finalized codeframe
          const batchPrompt = `Apply the following finalized codeframe to these responses. 
          For each response, assign the appropriate code(s) from the codeframe.
          
          Codeframe:
          ${JSON.stringify(results.codeframe, null, 2)}
          
          Responses to code:
          ${JSON.stringify(batch, null, 2)}
          
          Return a JSON array where each item has:
          - responseText: the original response text
          - rowIndex: the row index from the input
          - columnIndex: the column index from the input
          - columnName: the column name from the input
          - codesAssigned: array of code identifiers assigned`;
          
          const response = await fetch(`${apiConfig.apiUrl || "https://api.openai.com/v1/chat/completions"}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiConfig.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                {
                  role: "system",
                  content: "You are an expert coder applying a finalized codeframe to survey responses. Apply codes accurately based on the definitions provided."
                },
                {
                  role: "user",
                  content: batchPrompt
                }
              ],
              temperature: 0.3,
              max_tokens: 2000,
              response_format: { type: "json_object" }
            })
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          const batchResults = JSON.parse(data.choices[0].message.content);
          
          if (Array.isArray(batchResults)) {
            processedResponses.push(...batchResults);
          } else if (batchResults.codedResponses) {
            processedResponses.push(...batchResults.codedResponses);
          }
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (batchError) {
          console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, batchError);
          // Continue with next batch
        }
      }
      
      // Update results with all coded responses
      const updatedResults = {
        ...results,
        codedResponses: processedResponses,
        fullDatasetApplied: true,
        totalResponsesProcessed: allResponses.length
      };
      
      // Update the results in the processing management hook
      refineCodeframe(updatedResults);
      
      setProcessingStatus('');
      
      toast({
        title: "Full Dataset Processed",
        description: `Successfully applied codeframe to ${processedResponses.length} responses from ${allResponses.length} total responses.`
      });
    } catch (error) {
      console.error('Full dataset application error:', error);
      setProcessingStatus('');
      toast({
        variant: "destructive",
        title: "Application Failed",
        description: error instanceof Error ? error.message : "An error occurred while applying to full dataset."
      });
    }
  };

  const downloadBinaryMatrix = () => {
    if (!results) return;
    
    const binaryData = results.codedResponses.map(response => {
      const row: Record<string, any> = {
        'Response Text': response.responseText,
        'Column': response.columnName || 'Unknown'
      };
      
      results.codeframe.forEach(code => {
        row[code.label] = response.codesAssigned.includes(code.code) ? 1 : 0;
      });
      
      return row;
    });

    const headers = Object.keys(binaryData[0] || {});
    const csvContent = [
      headers.join(','),
      ...binaryData.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'binary_coded_matrix.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "✅ Binary Matrix Downloaded Successfully",
      description: "Binary-coded matrix has been saved to your downloads folder",
      duration: 5000,
    });
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
    codeframeRules,
    trackingConfig,
    isCodeframeFinalized,
    hasUnsavedChanges,
    columnQuestionConfigs,
    brandList,
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
    setColumnQuestionConfig,
    updateColumnSetting,
    setProjectContext,
    toggleRefinementMode,
    refineCodeframe,
    setCodeframeRules,
    setTrackingConfig,
    finalizeCodeframe,
    unlockCodeframe,
    saveChanges,
    reprocessWithAI,
    applyToFullDataset,
    downloadBinaryMatrix,
    saveBrandList,
    downloadMoniglewCSV: handleDownloadMoniglewCSV
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
