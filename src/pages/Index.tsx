
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
import ProjectSetup from '../components/ProjectSetup';
import CodeframeRefinement from '../components/CodeframeRefinement';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { FileCode } from "lucide-react";

// Create an inner component that uses the context
const IndexContent: React.FC = () => {
  const { 
    uploadedFile, 
    results, 
    processingProgress, 
    apiConfig, 
    projectContext, 
    setProjectContext,
    isRefinementMode,
    toggleRefinementMode,
    refineCodeframe
  } = useProcessing();
  
  return (
    <div className="space-y-6">
      {/* Always show API config first if not configured */}
      {!apiConfig?.isConfigured && (
        <div id="api-config-section">
          <ApiKeyConfig />
        </div>
      )}
      
      {/* Project Setup - show after API is configured but before project context is set */}
      {apiConfig?.isConfigured && !projectContext && (
        <ProjectSetup 
          onComplete={setProjectContext}
          isConfigured={!!projectContext}
        />
      )}
      
      {/* Only show the rest of the content if API and project context are configured */}
      <div className={`${(!apiConfig?.isConfigured || !projectContext) ? 'opacity-50 pointer-events-none' : ''}`}>
        {!uploadedFile && projectContext && (
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
          {!uploadedFile && projectContext && <FileUploader />}
          
          {uploadedFile && !results && processingProgress === 0 && <FilePreview />}
          
          {processingProgress > 0 && <ProcessingStatus />}
          
          {results && (
            <>
              <CodeframeRefinement
                codeframe={results.codeframe}
                onRefine={refineCodeframe}
                isRefinementMode={isRefinementMode}
                onToggleRefinement={toggleRefinementMode}
              />
              <ResultsView />
            </>
          )}
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
