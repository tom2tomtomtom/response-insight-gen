
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Building, FileText, Target } from 'lucide-react';

interface ProjectSetupData {
  industry: string;
  clientName: string;
  studyObjective: string;
  studyType: 'tracking' | 'new';
}

interface ProjectSetupProps {
  onComplete: (data: ProjectSetupData) => void;
  isConfigured: boolean;
}

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Retail & Consumer Goods',
  'Automotive',
  'Telecommunications',
  'Energy & Utilities',
  'Food & Beverage',
  'Travel & Hospitality',
  'Education',
  'Media & Entertainment',
  'Real Estate',
  'Manufacturing',
  'Other'
];

const ProjectSetup: React.FC<ProjectSetupProps> = ({ onComplete, isConfigured }) => {
  const form = useForm<ProjectSetupData>({
    defaultValues: {
      industry: '',
      clientName: '',
      studyObjective: '',
      studyType: 'new'
    }
  });

  const onSubmit = (data: ProjectSetupData) => {
    onComplete(data);
  };

  if (isConfigured) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Project Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="industry"
              rules={{ required: "Please select an industry" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This helps tailor the codeframe generation to industry-specific themes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientName"
              rules={{ required: "Please enter a client name" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client or project name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Used for context and output file naming
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studyObjective"
              rules={{ required: "Please describe the study objective" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Objective</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this survey aims to understand..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of the research goals and key questions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Study Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">New Study</SelectItem>
                      <SelectItem value="tracking">Tracking Study</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Tracking studies can reuse previous wave codeframes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              <Target className="h-4 w-4 mr-2" />
              Set Up Project
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProjectSetup;
