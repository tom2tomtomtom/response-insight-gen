
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
import ColumnSelector from '../components/ColumnSelector';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoCircledIcon } from "@radix-ui/react-icons";

// Create an inner component that uses the context
const IndexContent: React.FC = () => {
  const { uploadedFile, results, processingProgress, apiConfig, fileColumns } = useProcessing();
  
  return (
    <div className="space-y-6">
      {!uploadedFile && (
        <div id="api-config-section" className={`${apiConfig?.isConfigured ? 'hidden' : ''}`}>
          {!apiConfig?.isConfigured && (
            <Alert variant="info" className="mb-4 border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <InfoCircledIcon className="h-4 w-4 text-blue-500" />
              <AlertTitle>Demo Mode Active</AlertTitle>
              <AlertDescription>
                You're currently using the app in demo mode. For real text analysis, please configure your API key below.
              </AlertDescription>
            </Alert>
          )}
          <ApiKeyConfig />
        </div>
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
