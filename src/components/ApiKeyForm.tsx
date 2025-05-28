
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from './ui/form';
import { ExternalLink, Info } from 'lucide-react';
import { toast } from './ui/use-toast';

interface ApiConfigFormValues {
  apiKey: string;
  apiUrl: string;
}

interface ApiKeyFormProps {
  onSubmit: (values: ApiConfigFormValues) => Promise<void>;
  onShowHelp: () => void;
  defaultValues?: Partial<ApiConfigFormValues>;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({ onSubmit, onShowHelp, defaultValues }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<ApiConfigFormValues>({
    defaultValues: {
      apiKey: '',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      ...defaultValues
    }
  });

  const handleSubmit = async (values: ApiConfigFormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(values);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                <Button type="button" variant="ghost" size="sm" className="h-5 px-1" onClick={onShowHelp}>
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
      </form>
    </Form>
  );
};

export default ApiKeyForm;
