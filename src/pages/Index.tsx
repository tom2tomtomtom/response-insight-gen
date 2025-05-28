
import React from 'react';
import Layout from '../components/Layout';
import IntroCard from '../components/IntroCard';
import ApiKeyConfig from '../components/ApiKeyConfig';
import FileUploader from '../components/FileUploader';
import { useProcessing } from '../contexts/ProcessingContext';

const Index: React.FC = () => {
  const { apiConfig } = useProcessing();

  return (
    <Layout>
      <div className="space-y-8">
        <IntroCard />
        
        {/* API Configuration Section */}
        <div className="w-full max-w-2xl mx-auto">
          <ApiKeyConfig />
        </div>

        {/* File Upload Section - only show if API is configured */}
        {apiConfig?.isConfigured && (
          <div className="w-full max-w-4xl mx-auto">
            <FileUploader />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;
