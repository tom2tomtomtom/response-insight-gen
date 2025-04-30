
import React, { useState } from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from './ui/form';
import { useForm } from 'react-hook-form';
import { Key, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import { toast } from './ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ApiConfigFormValues {
  apiKey: string;
  apiUrl: string;
}

const ApiKeyConfig: React.FC = () => {
  const { apiConfig, setApiConfig, testApiConnection } = useProcessing();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<ApiConfigFormValues>({
    defaultValues: {
      apiKey: apiConfig?.apiKey || '',
      apiUrl: apiConfig?.apiUrl || 'https://api.textanalysis.com/v1'
    }
  });

  const onSubmit = async (values: ApiConfigFormValues) => {
    setIsLoading(true);
    try {
      // For demo purposes, always succeed with any key for now
      // In production, this would check the actual API
      setApiConfig({
        apiKey: values.apiKey,
        apiUrl: values.apiUrl,
        isConfigured: true
      });
      
      toast({
        title: "API Key Configured",
        description: "Your API key has been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "API Connection Failed",
        description: error instanceof Error ? error.message : "Could not verify API key",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Text Analysis API Configuration
        </CardTitle>
        <CardDescription>
          Configure your API key to process real text data with accurate analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle>Why use an API key?</AlertTitle>
          <AlertDescription>
            Without an API key, the application will use demo data for demonstration purposes.
            For accurate text analysis of your actual data, you'll need to provide an API key from
            a text analysis service provider.
          </AlertDescription>
        </Alert>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your API key"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your API key will be used to authenticate requests
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://api.textanalysis.com/v1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The endpoint for your text analysis service
                  </FormDescription>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !form.watch('apiKey')}
            >
              {isLoading ? "Verifying..." : "Save & Verify API Key"}
            </Button>

            {!apiConfig?.isConfigured && (
              <div className="text-center text-sm text-muted-foreground mt-2">
                <p>Don't have an API key?{' '}
                  <a 
                    href="https://platform.openai.com/account/api-keys" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary inline-flex items-center hover:underline"
                  >
                    Try OpenAI
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                  {' '}or{' '}
                  <a 
                    href="https://portal.azure.com/#blade/HubsExtension/BrowseResourceBlade/resourceType/Microsoft.CognitiveServices%2Faccounts" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-primary inline-flex items-center hover:underline"
                  >
                    Azure Text Analytics
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </p>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
      
      {apiConfig?.isConfigured && (
        <CardFooter className="bg-green-50 dark:bg-green-950 flex gap-2 items-center">
          <CheckCircle2 className="text-green-600 h-5 w-5" />
          <span className="text-sm text-green-600">API key configured successfully</span>
        </CardFooter>
      )}
    </Card>
  );
};

export default ApiKeyConfig;
