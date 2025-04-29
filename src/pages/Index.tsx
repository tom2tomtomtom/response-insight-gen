
import React from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import Layout from '../components/Layout';
import IntroCard from '../components/IntroCard';
import WorkflowSteps from '../components/WorkflowSteps';
import FileUploader from '../components/FileUploader';
import FilePreview from '../components/FilePreview';
import ProcessingStatus from '../components/ProcessingStatus';
import ResultsView from '../components/ResultsView';

const Index: React.FC = () => {
  const { uploadedFile, results, processingProgress } = useProcessing();
  
  return (
    <Layout>
      <div className="space-y-6">
        {!uploadedFile && <IntroCard />}
        
        <WorkflowSteps />
        
        <div className="space-y-6">
          {!uploadedFile && <FileUploader />}
          
          {uploadedFile && !results && processingProgress === 0 && <FilePreview />}
          
          {processingProgress > 0 && <ProcessingStatus />}
          
          {results && <ResultsView />}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
