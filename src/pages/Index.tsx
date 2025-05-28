
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import FileUploader from '../components/FileUploader';
import ColumnSelector from '../components/ColumnSelector';
import EnhancedProcessingStatus from '../components/EnhancedProcessingStatus';
import ResultsView from '../components/ResultsView';
import { useProcessing } from '../contexts/ProcessingContext';
import { Settings, Upload, BarChart3, FileText, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index: React.FC = () => {
  const { 
    apiConfig, 
    uploadedFile, 
    fileColumns, 
    startProcessing, 
    isProcessing,
    results,
    resetState
  } = useProcessing();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('setup');

  // Redirect to API config if not configured
  React.useEffect(() => {
    if (!apiConfig?.isConfigured) {
      navigate('/api-config');
    }
  }, [apiConfig?.isConfigured, navigate]);

  // Auto-switch tabs based on workflow progress
  React.useEffect(() => {
    if (isProcessing) {
      setActiveTab('analysis');
    } else if (results) {
      setActiveTab('results');
    }
  }, [isProcessing, results]);

  const handleContinueToAnalysis = async () => {
    console.log('Starting analysis...');
    setActiveTab('analysis');
    await startProcessing();
  };

  const handleReset = () => {
    resetState();
    setActiveTab('setup');
  };

  const handleReconfigureApi = () => {
    navigate('/api-config');
  };

  // Don't render if API not configured
  if (!apiConfig?.isConfigured) {
    return null;
  }

  const hasUploadedFile = uploadedFile && fileColumns && fileColumns.length > 0;
  const canAnalyze = hasUploadedFile;
  const hasResults = !!results;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Survey Response Analysis</h1>
          <p className="text-muted-foreground">AI-powered codeframe generation and response coding</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Setup
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              disabled={!canAnalyze}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analysis
              {isProcessing && <Badge variant="secondary" className="ml-1">Running</Badge>}
            </TabsTrigger>
            <TabsTrigger 
              value="results" 
              disabled={!hasResults}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Results
              {hasResults && <Badge variant="secondary" className="ml-1">Ready</Badge>}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
            <div className="w-full max-w-4xl mx-auto space-y-6">
              {!uploadedFile && (
                <FileUploader />
              )}
              
              {hasUploadedFile && (
                <ColumnSelector onContinueToAnalysis={handleContinueToAnalysis} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="w-full max-w-4xl mx-auto">
              <EnhancedProcessingStatus />
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <div className="w-full">
              <ResultsView />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="w-full max-w-2xl mx-auto space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Workflow Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">API Configuration</p>
                      <p className="text-sm text-muted-foreground">
                        {apiConfig?.isConfigured ? 'API key is configured' : 'No API key configured'}
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleReconfigureApi}>
                      <Key className="h-4 w-4 mr-2" />
                      Reconfigure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Reset Workflow</p>
                      <p className="text-sm text-muted-foreground">
                        Clear all data and start over
                      </p>
                    </div>
                    <Button variant="destructive" onClick={handleReset}>
                      Reset All
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">File Status</p>
                        <p className="text-muted-foreground">
                          {uploadedFile ? uploadedFile.filename : 'No file uploaded'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Columns Detected</p>
                        <p className="text-muted-foreground">
                          {fileColumns ? `${fileColumns.length} columns` : 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Index;
