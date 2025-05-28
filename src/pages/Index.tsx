import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useProcessing } from '../contexts/ProcessingContext';
import Layout from '../components/Layout';
import FileUploader from '../components/FileUploader';
import ColumnSelector from '../components/ColumnSelector';
import CodeframeApplication from '../components/CodeframeApplication';
import ResultsView from '../components/ResultsView';
import EnhancedProcessingStatus from '../components/EnhancedProcessingStatus';

const Index = () => {
  const [activeTab, setActiveTab] = useState("upload");
  
  const { 
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
    uploadedCodeframe,
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
    setApiConfig,
    testApiConnection,
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
    downloadMoniglewCSV
  } = useProcessing();

  const handleContinueToAnalysis = () => {
    setActiveTab("processing");
  };

  // Auto-navigate to results when processing completes
  useEffect(() => {
    if (!isProcessing && processingProgress === 100 && results) {
      // Small delay to show completion state briefly
      const timer = setTimeout(() => {
        setActiveTab("results");
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isProcessing, processingProgress, results]);

  // Enhanced start processing with navigation callback
  const handleStartProcessing = async () => {
    await startProcessing();
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Qualitative Data Analysis Platform
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your open-ended survey responses into actionable insights with AI-powered coding and analysis
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="upload">Upload & Setup</TabsTrigger>
              <TabsTrigger value="processing">Analysis</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="codeframe-app">Apply Codeframe</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="output">Output</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <FileUploader />
              {uploadedFile && fileColumns.length > 0 && (
                <ColumnSelector onContinueToAnalysis={handleContinueToAnalysis} />
              )}
            </TabsContent>

            <TabsContent value="processing" className="space-y-6">
              {/* Enhanced Processing Status */}
              <EnhancedProcessingStatus />
              
              <div>
                {isProcessing ? (
                  <div className="text-center mt-6">
                    <p className="text-muted-foreground">
                      Your analysis is running. Feel free to watch the progress above or check back in a few minutes.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    {!uploadedFile ? (
                      <p>Please upload a file first in the Upload & Setup tab.</p>
                    ) : selectedColumns.length === 0 ? (
                      <p>Please select columns to analyze in the Upload & Setup tab.</p>
                    ) : (
                      <>
                        <p>Ready to start processing {selectedColumns.length} selected column{selectedColumns.length !== 1 ? 's' : ''}?</p>
                        <Button onClick={handleStartProcessing} disabled={isProcessing || !uploadedFile}>
                          Start Processing
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {results ? (
                <ResultsView />
              ) : (
                <div className="p-6 text-center">
                  <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
                  <p>No results available yet. Please run the analysis first.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="codeframe-app" className="space-y-6">
              <CodeframeApplication />
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">AI Insights</h2>
                {insights ? (
                  <div className="bg-white rounded-lg p-4 shadow">
                    <p className="text-gray-700">{insights}</p>
                  </div>
                ) : (
                  <p>No insights available yet. Please run the analysis first.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="output" className="space-y-6">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Output Options</h2>
                <div className="space-y-4">
                  <Button onClick={downloadResults} disabled={!results}>
                    Download Excel Results
                  </Button>
                  <Button onClick={downloadMoniglewCSV} disabled={!results}>
                    Download Moniglew CSV
                  </Button>
                  <Button onClick={downloadBinaryMatrix} disabled={!results}>
                    Download Binary Matrix
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
