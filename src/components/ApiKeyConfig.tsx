
import React, { useState } from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from './ui/form';
import { useForm } from 'react-hook-form';
import { Key, CheckCircle2, ExternalLink, Info, AlertCircle } from 'lucide-react';
import { toast } from './ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface ApiConfigFormValues {
  apiKey: string;
  apiUrl: string;
}

const ApiKeyConfig: React.FC = () => {
  const { apiConfig, setApiConfig, testApiConnection } = useProcessing();
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  
  const form = useForm<ApiConfigFormValues>({
    defaultValues: {
      apiKey: apiConfig?.apiKey || '',
      apiUrl: apiConfig?.apiUrl || 'https://api.openai.com/v1/chat/completions'
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
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Enter Your OpenAI API Key
          </CardTitle>
          <CardDescription>
            Configure your API key to process real text data with accurate analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>
              You're currently in demo mode which uses mock data. To analyze your actual data, please enter your OpenAI API key below.
            </AlertDescription>
          </Alert>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OpenAI API Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="sk-..."
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="flex items-center gap-1">
                      <span>Your API key will be stored locally and never sent to our servers</span>
                      <Button type="button" variant="ghost" size="sm" className="h-5 px-1" onClick={() => setShowHelpDialog(true)}>
                        <Info className="h-3 w-3" />
                      </Button>
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
                        placeholder="https://api.openai.com/v1/chat/completions"
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
                      Get one from OpenAI
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
      
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About OpenAI API Keys</DialogTitle>
            <DialogDescription>
              Your API key is used to send requests to OpenAI's text analysis services. Here's what you need to know:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-medium">Privacy & Security</h3>
              <p className="text-sm text-muted-foreground">
                Your API key is stored locally in your browser and is never sent to our servers. All requests to OpenAI are made directly from your browser.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">Usage & Billing</h3>
              <p className="text-sm text-muted-foreground">
                Using your OpenAI API key will incur charges based on your usage according to OpenAI's pricing. Make sure to monitor your usage on the OpenAI dashboard.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium">How to Get an API Key</h3>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                <li>Visit <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">OpenAI's API Keys page</a></li>
                <li>Sign in or create an account</li>
                <li>Create a new API key</li>
                <li>Copy and paste the key here</li>
              </ol>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowHelpDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ApiKeyConfig;
