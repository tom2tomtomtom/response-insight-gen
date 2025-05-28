
import React from 'react';
import Layout from '../components/Layout';
import IntroCard from '../components/IntroCard';
import ApiKeyConfig from '../components/ApiKeyConfig';
import FileUploader from '../components/FileUploader';
import ColumnSelector from '../components/ColumnSelector';
import { useProcessing } from '../contexts/ProcessingContext';

const Index: React.FC = () => {
  const { apiConfig, uploadedFile, fileColumns } = useProcessing();

  return (
    <Layout>
      <div className="space-y-8">
        <IntroCard />
        
        {/* API Configuration Section */}
        <div className="w-full max-w-2xl mx-auto">
          <ApiKeyConfig />
        </div>

        {/* File Upload Section - only show if API is configured */}
        {apiConfig?.isConfigured && !uploadedFile && (
          <div className="w-full max-w-4xl mx-auto">
            <FileUploader />
          </div>
        )}

        {/* Column Selection Section - show after file is uploaded */}
        {apiConfig?.isConfigured && uploadedFile && fileColumns && fileColumns.length > 0 && (
          <div className="w-full max-w-6xl mx-auto">
            <ColumnSelector onContinueToAnalysis={() => {
              // This will be handled by the ColumnSelector component itself
              console.log('Continuing to analysis...');
            }} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
