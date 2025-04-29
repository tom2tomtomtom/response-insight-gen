
import React from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { ProcessingProvider } from '../contexts/ProcessingContext';
import Layout from '../components/Layout';
import IntroCard from '../components/IntroCard';
import WorkflowSteps from '../components/WorkflowSteps';
import FileUploader from '../components/FileUploader';
import FilePreview from '../components/FilePreview';
import ProcessingStatus from '../components/ProcessingStatus';
import ResultsView from '../components/ResultsView';
import ApiKeyConfig from '../components/ApiKeyConfig';
import ColumnSelector from './components/ColumnSelector';

// Create an inner component that uses the context
const IndexContent: React.FC = () => {
  const { uploadedFile, results, processingProgress, apiConfig, fileColumns } = useProcessing();
  
  return (
    <div className="space-y-6">
      {!uploadedFile && !apiConfig?.isConfigured && (
        <ApiKeyConfig />
      )}
      
      {!uploadedFile && <IntroCard />}
      
      <WorkflowSteps />
      
      <div className="space-y-6">
        {!uploadedFile && <FileUploader />}
        
        {uploadedFile && !results && processingProgress === 0 && <FilePreview />}
        
        {processingProgress > 0 && <ProcessingStatus />}
        
        {results && <ResultsView />}
      </div>
    </div>
  );
};

// Main Index component wraps everything with the needed providers
const Index: React.FC = () => {
  return (
    <ProcessingProvider>
      <Layout>
        <IndexContent />
      </Layout>
    </ProcessingProvider>
  );
};

export default Index;
