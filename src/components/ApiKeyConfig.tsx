
import React, { useState, useEffect } from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Key, AlertTriangle } from 'lucide-react';
import { toast } from './ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import ApiKeyForm from './ApiKeyForm';
import ApiKeyHelpDialog from './ApiKeyHelpDialog';
import ApiKeySuccessFooter from './ApiKeySuccessFooter';

interface ApiConfigFormValues {
  apiKey: string;
  apiUrl: string;
}

// Session storage keys
const API_KEY_STORAGE_KEY = 'qualCode_apiKey';
const API_URL_STORAGE_KEY = 'qualCode_apiUrl';

const ApiKeyConfig: React.FC = () => {
  const { apiConfig, setApiConfig, testApiConnection } = useProcessing();
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [formDefaults, setFormDefaults] = useState<Partial<ApiConfigFormValues>>({});

  // Load saved API config from session storage on component mount
  useEffect(() => {
    const savedApiKey = sessionStorage.getItem(API_KEY_STORAGE_KEY);
    const savedApiUrl = sessionStorage.getItem(API_URL_STORAGE_KEY);
    
    const defaults: Partial<ApiConfigFormValues> = {};
    
    if (savedApiKey) {
      defaults.apiKey = savedApiKey;
    }
    
    if (savedApiUrl) {
      defaults.apiUrl = savedApiUrl;
    }
    
    setFormDefaults(defaults);
    
    // If we have both key and URL, apply them to the app state
    if (savedApiKey && savedApiUrl) {
      setApiConfig({
        apiKey: savedApiKey,
        apiUrl: savedApiUrl,
        isConfigured: true
      });
    }
  }, [setApiConfig]);

  const handleSubmit = async (values: ApiConfigFormValues) => {
    try {
      // Test the API connection first
      const success = await testApiConnection(values.apiKey, values.apiUrl);
      
      if (success) {
        // Save to session storage
        sessionStorage.setItem(API_KEY_STORAGE_KEY, values.apiKey);
        sessionStorage.setItem(API_URL_STORAGE_KEY, values.apiUrl);
        
        // Only set the config if the test was successful
        setApiConfig({
          apiKey: values.apiKey,
          apiUrl: values.apiUrl,
          isConfigured: true
        });
        
        toast({
          title: "API Key Configured",
          description: "Your API key has been saved successfully.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "API Connection Failed",
        description: error instanceof Error ? error.message : "Could not verify API key",
      });
    }
  };

  return (
    <>
      <Card className="w-full" id="api-config-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API Key Required
          </CardTitle>
          <CardDescription>
            Configure your API key to analyze your text data with AI-powered analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>
              This tool requires an OpenAI API key to function. Please enter your API key below to continue with analysis.
            </AlertDescription>
          </Alert>
          
          <ApiKeyForm 
            onSubmit={handleSubmit}
            onShowHelp={() => setShowHelpDialog(true)}
            defaultValues={formDefaults}
          />
        </CardContent>
        
        <ApiKeySuccessFooter isConfigured={apiConfig?.isConfigured || false} />
      </Card>
      
      <ApiKeyHelpDialog 
        open={showHelpDialog} 
        onOpenChange={setShowHelpDialog} 
      />
    </>
  );
};

export default ApiKeyConfig;
