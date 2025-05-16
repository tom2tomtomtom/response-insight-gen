
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
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { FileCode } from "lucide-react";

// Create an inner component that uses the context
const IndexContent: React.FC = () => {
  const { uploadedFile, results, processingProgress, apiConfig, fileColumns } = useProcessing();
  
  return (
    <div className="space-y-6">
      {/* Always show API config first if not configured */}
      {!apiConfig?.isConfigured && (
        <div id="api-config-section">
          <ApiKeyConfig />
        </div>
      )}
      
      {/* Only show the rest of the content if API is configured or if we're just in demo mode */}
      <div className={`${!apiConfig?.isConfigured ? 'opacity-50 pointer-events-none' : ''}`}>
        {!uploadedFile && (
          <>
            <IntroCard />
            <div className="flex justify-end mb-4">
              <Button variant="outline" asChild className="flex items-center gap-2">
                <Link to="/upload-codeframe">
                  <FileCode className="h-4 w-4" />
                  <span>Upload Existing Codeframe</span>
                </Link>
              </Button>
            </div>
          </>
        )}
        
        <WorkflowSteps />
        
        <div className="space-y-6">
          {!uploadedFile && <FileUploader />}
          
          {uploadedFile && !results && processingProgress === 0 && <FilePreview />}
          
          {processingProgress > 0 && <ProcessingStatus />}
          
          {results && <ResultsView />}
        </div>
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
