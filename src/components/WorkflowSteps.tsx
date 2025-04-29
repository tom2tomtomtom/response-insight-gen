
import React from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { FileText, FileCode, Table, CheckSquare } from 'lucide-react';

const WorkflowSteps: React.FC = () => {
  const { uploadedFile, isProcessing, processingProgress, results } = useProcessing();
  
  // Determine current step
  let currentStep = 1;
  if (results) {
    currentStep = 4;
  } else if (processingProgress > 0) {
    currentStep = 3;
  } else if (uploadedFile) {
    currentStep = 2;
  }
  
  const steps = [
    {
      title: 'Upload File',
      description: 'Upload an Excel file with survey responses',
      icon: FileText,
      status: currentStep >= 1 ? 'complete' : 'upcoming'
    },
    {
      title: 'Review Data',
      description: 'Preview responses and start processing',
      icon: Table,
      status: currentStep >= 2 ? 'complete' : 'upcoming'
    },
    {
      title: 'AI Processing',
      description: 'Generate codeframe and code responses',
      icon: FileCode,
      status: currentStep >= 3 ? (isProcessing ? 'active' : 'complete') : 'upcoming'
    },
    {
      title: 'Download Results',
      description: 'Review analysis and download Excel file',
      icon: CheckSquare,
      status: currentStep >= 4 ? 'complete' : 'upcoming'
    }
  ];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analysis Workflow</CardTitle>
        <CardDescription>Follow these steps to code your responses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <div 
              key={step.title}
              className={`flex flex-col items-center p-4 rounded-lg ${
                step.status === 'active' 
                  ? 'bg-primary/10 border border-primary' 
                  : step.status === 'complete' 
                    ? 'bg-muted' 
                    : 'bg-card border border-dashed'
              }`}
            >
              <div className="relative mb-2">
                <step.icon className={`h-6 w-6 ${
                  step.status === 'active' 
                    ? 'text-primary' 
                    : step.status === 'complete' 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                }`} />
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[8px] text-white font-semibold">{index + 1}</span>
                </div>
              </div>
              <h3 className={`font-medium text-sm text-center ${
                step.status !== 'upcoming' ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.title}
              </h3>
              <p className="text-xs text-center text-muted-foreground mt-1">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowSteps;
