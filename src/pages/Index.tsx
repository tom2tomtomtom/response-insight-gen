
import React from 'react';
import Layout from '../components/Layout';
import IntroCard from '../components/IntroCard';
import ApiKeyConfig from '../components/ApiKeyConfig';
import FileUploader from '../components/FileUploader';
import ColumnSelector from '../components/ColumnSelector';
import ProcessingStatus from '../components/ProcessingStatus';
import ResultsView from '../components/ResultsView';
import { useProcessing } from '../contexts/ProcessingContext';

const Index: React.FC = () => {
  const { 
    apiConfig, 
    uploadedFile, 
    fileColumns, 
    startProcessing, 
    isProcessing,
    results 
  } = useProcessing();

  const handleContinueToAnalysis = async () => {
    console.log('Starting analysis...');
    await startProcessing();
  };

  // Show results if processing is complete
  if (results) {
    return (
      <Layout>
        <div className="space-y-8">
          <ResultsView />
        </div>
      </Layout>
    );
  }

  // Show processing status during analysis
  if (isProcessing) {
    return (
      <Layout>
        <div className="space-y-8">
          <ProcessingStatus />
        </div>
      </Layout>
    );
  }

  // Main workflow - show steps progressively
  return (
    <Layout>
      <div className="space-y-8">
        <IntroCard />
        
        {/* Always show API Configuration Section */}
        <div className="w-full max-w-2xl mx-auto">
          <ApiKeyConfig />
        </div>

        {/* File Upload Section - only show if API is configured and no file uploaded yet */}
        {apiConfig?.isConfigured && !uploadedFile && (
          <div className="w-full max-w-4xl mx-auto">
            <FileUploader />
          </div>
        )}

        {/* Column Selection Section - show after file is uploaded and columns are detected */}
        {apiConfig?.isConfigured && uploadedFile && fileColumns && fileColumns.length > 0 && (
          <div className="w-full max-w-6xl mx-auto">
            <ColumnSelector onContinueToAnalysis={handleContinueToAnalysis} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
