
import React from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { CheckCircle, Loader2 } from 'lucide-react';

const ProcessingStatus: React.FC = () => {
  const { isProcessing, processingStatus, processingProgress } = useProcessing();
  
  if (!isProcessing && processingProgress === 0) {
    return null;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {processingProgress < 100 ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          <span>Processing Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{processingStatus}</span>
            <span>{processingProgress}%</span>
          </div>
          <Progress value={processingProgress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {['Uploading', 'Analyzing', 'Generating Codeframe', 'Complete'].map((step, index) => {
            const stepProgress = ((index + 1) * 25);
            return (
              <div 
                key={step} 
                className={`text-xs text-center py-1 px-2 rounded ${
                  processingProgress >= stepProgress 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;
