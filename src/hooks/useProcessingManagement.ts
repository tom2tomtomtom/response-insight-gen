
import { useState } from 'react';
import { ProcessedResult, UploadedFile, ApiConfig, CodeframeEntry } from '../types';
import { toast } from '../components/ui/use-toast';
import { 
  processFile, 
  getProcessingResult, 
  generateExcelFile,
  testApiConnection as apiTestConnection,
  setApiSelectedColumns,
  setColumnQuestionTypes as setApiColumnQuestionTypes
} from '../services/api';
import { QuestionType } from '../contexts/types';

export const useProcessingManagement = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [results, setResults] = useState<ProcessedResult | null>(null);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [multipleCodeframes, setMultipleCodeframes] = useState<Record<string, any> | null>(null);
  const [insights, setInsights] = useState<string | null>(null);

  const testApiConnection = async (apiKey: string, apiUrl: string): Promise<boolean> => {
    try {
      await apiTestConnection(apiKey, apiUrl);
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

  const startProcessing = async (
    uploadedFile: UploadedFile,
    selectedColumns: number[],
    fileColumns: any[],
    columnQuestionTypes: Record<number, QuestionType>,
    columnSettings: any,
    apiConfig: ApiConfig | null
  ) => {
    if (!uploadedFile || !uploadedFile.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No file has been uploaded",
      });
      return;
    }

    if (!apiConfig?.apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please configure your OpenAI API key before processing",
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
      }).filter(Boolean);
      
      setApiSelectedColumns(selectedColumnsInfo);
      setApiColumnQuestionTypes(columnQuestionTypes);
      
      const response = await processFile(uploadedFile.id, apiConfig);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Processing failed to start');
      }
      
      await pollForResults(uploadedFile.id, apiConfig, columnQuestionTypes);
    } catch (error) {
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "An error occurred during processing",
      });
    }
  };

  const pollForResults = async (fileId: string, apiConfig: ApiConfig, columnQuestionTypes: Record<number, QuestionType>) => {
    try {
      setProcessingStatus('Analyzing responses by question type...');
      setProcessingProgress(30);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProcessingStatus('Generating codeframes...');
      setProcessingProgress(60);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProcessingStatus('Mapping responses to codes...');
      setProcessingProgress(80);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProcessingStatus('Generating insights...');
      setProcessingProgress(90);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await getProcessingResult(fileId, apiConfig);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to retrieve results');
      }
      
      console.log('Processing response received:', response.data);
      
      setResults(response.data);
      
      if (response.data.multipleCodeframes) {
        setMultipleCodeframes(response.data.multipleCodeframes);
        console.log('Multiple codeframes set:', response.data.multipleCodeframes);
      }
      
      // Use insights from API response
      if (response.data.insights) {
        setInsights(response.data.insights);
        console.log('Using API insights:', response.data.insights);
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

  const generateDemoInsights = (results: ProcessedResult, columnQuestionTypes: Record<number, QuestionType>): string => {
    const totalResponses = results.codedResponses.length;
    const totalCodes = results.codeframe.length;
    const questionTypeCount = Object.keys(columnQuestionTypes).length;
    
    // Get most common codes
    const codeFrequency: Record<string, number> = {};
    results.codedResponses.forEach(response => {
      response.codesAssigned.forEach(code => {
        codeFrequency[code] = (codeFrequency[code] || 0) + 1;
      });
    });
    
    const topCodes = Object.entries(codeFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([code, count]) => ({ code, count, percentage: Math.round((count / totalResponses) * 100) }));
    
    let insights = `Analysis Summary\n\n`;
    insights += `Your analysis processed ${totalResponses} responses across ${questionTypeCount} question type${questionTypeCount > 1 ? 's' : ''}, generating ${totalCodes} distinct codes.\n\n`;
    
    if (topCodes.length > 0) {
      insights += `Key Findings:\n`;
      topCodes.forEach((item, index) => {
        const codeInfo = results.codeframe.find(c => c.code === item.code);
        const codeName = codeInfo?.label || item.code;
        insights += `${index + 1}. ${codeName}: Mentioned in ${item.percentage}% of responses (${item.count} mentions)\n`;
      });
      insights += `\n`;
    }
    
    // Add question type specific insights
    if (questionTypeCount > 1) {
      const questionTypes = Object.values(columnQuestionTypes);
      const uniqueTypes = [...new Set(questionTypes)];
      insights += `Question Types Analyzed:\n`;
      uniqueTypes.forEach(type => {
        const count = questionTypes.filter(t => t === type).length;
        insights += `- ${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${count} question${count > 1 ? 's' : ''}\n`;
      });
      insights += `\n`;
    }
    
    insights += `The analysis revealed patterns in response themes and sentiment. Consider reviewing the detailed codeframe and coded responses for deeper insights into participant feedback.`;
    
    return insights;
  };

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

  const downloadMoniglewCSV = async () => {
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
      setProcessingStatus('Generating Moniglew-style CSV...');
      
      // Use the new formatter
      const { MoniglewStyleFormatter } = await import('../utils/moniglewStyleFormatter');
      const formatter = new MoniglewStyleFormatter(results);
      const csv = formatter.generateCSV();
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'moniglew_style_output.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Moniglew CSV Downloaded",
        description: "Your industry-standard CSV file has been generated",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "CSV Generation Failed",
        description: error instanceof Error ? error.message : "An error occurred while generating the CSV file",
      });
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const refineCodeframe = async (codeframe: CodeframeEntry[]) => {
    if (!results) return;
    
    try {
      setIsProcessing(true);
      setProcessingStatus('Refining codeframe...');
      
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

  return {
    isProcessing,
    processingStatus,
    processingProgress,
    results,
    isGeneratingExcel,
    multipleCodeframes,
    insights,
    testApiConnection,
    startProcessing,
    downloadResults,
    refineCodeframe,
    setResults,
    setMultipleCodeframes,
    setInsights,
    setProcessingStatus,
    downloadMoniglewCSV
  };
};
