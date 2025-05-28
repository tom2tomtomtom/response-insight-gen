import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useProcessing } from '../contexts/ProcessingContext';
import { Layout } from '../components/Layout';
import FileUpload from '../components/FileUpload';
import ResultsDisplay from '../components/ResultsDisplay';
import InsightsDisplay from '../components/InsightsDisplay';
import OutputOptions from '../components/OutputOptions';
import CodeframeApplication from '../components/CodeframeApplication';

const Index = () => {
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

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="upload">Upload & Setup</TabsTrigger>
              <TabsTrigger value="processing">Analysis</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="codeframe-app">Apply Codeframe</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="output">Output</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <FileUpload />
            </TabsContent>

            <TabsContent value="processing" className="space-y-6">
              <div>
                {isProcessing ? (
                  <div className="text-center">
                    <p>{processingStatus}</p>
                    <progress value={processingProgress} max="100" className="w-full h-4"></progress>
                  </div>
                ) : (
                  <div className="text-center">
                    <p>Ready to start processing?</p>
                    <Button onClick={startProcessing} disabled={isProcessing || !uploadedFile}>
                      Start Processing
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              <ResultsDisplay />
            </TabsContent>

            <TabsContent value="codeframe-app" className="space-y-6">
              <CodeframeApplication />
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <InsightsDisplay />
            </TabsContent>

            <TabsContent value="output" className="space-y-6">
              <OutputOptions />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
