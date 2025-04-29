
import React, { useState } from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from './ui/form';
import { useForm } from 'react-hook-form';
import { Key, CheckCircle2 } from 'lucide-react';

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
      apiUrl: apiConfig?.apiUrl || 'https://api.example.com'
    }
  });

  const onSubmit = async (values: ApiConfigFormValues) => {
    setIsLoading(true);
    try {
      const success = await testApiConnection(values.apiKey, values.apiUrl);
      if (success) {
        setApiConfig({
          apiKey: values.apiKey,
          apiUrl: values.apiUrl,
          isConfigured: true
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Configuration
        </CardTitle>
        <CardDescription>
          Configure your API key to analyze real data
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                  <FormLabel>API URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://api.example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Leave as default unless you have a custom API endpoint
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
