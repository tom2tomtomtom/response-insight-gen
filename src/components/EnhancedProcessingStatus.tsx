import React, { useState, useEffect } from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  Loader2, 
  Clock,
  FileText,
  Brain,
  Database,
  Download
} from 'lucide-react';

interface ProcessingStep {
  name: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'complete';
  progress: number;
}

const EnhancedProcessingStatus: React.FC = () => {
  const { 
    isProcessing, 
    processingStatus, 
    processingProgress,
    selectedColumns,
    columnQuestionTypes
  } = useProcessing();
  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isProcessing && !startTime) {
      setStartTime(Date.now());
      setElapsedTime(0);
    } else if (!isProcessing) {
      setStartTime(null);
    }
  }, [isProcessing, startTime]);

  useEffect(() => {
    if (startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProcessingSteps = (): ProcessingStep[] => {
    const currentProgress = processingProgress || 0;
    
    return [
      {
        name: 'Initializing',
        icon: <FileText className="h-4 w-4" />,
        status: currentProgress >= 20 ? 'complete' : currentProgress > 0 ? 'active' : 'pending',
        progress: Math.min(currentProgress * 5, 100)
      },
      {
        name: 'Processing Question Types',
        icon: <Brain className="h-4 w-4" />,
        status: currentProgress >= 80 ? 'complete' : currentProgress >= 20 ? 'active' : 'pending',
        progress: currentProgress >= 20 ? Math.min(((currentProgress - 20) / 60) * 100, 100) : 0
      },
      {
        name: 'Generating Insights',
        icon: <Database className="h-4 w-4" />,
        status: currentProgress >= 90 ? 'complete' : currentProgress >= 80 ? 'active' : 'pending',
        progress: currentProgress >= 80 ? Math.min(((currentProgress - 80) / 10) * 100, 100) : 0
      },
      {
        name: 'Finalizing Results',
        icon: <Download className="h-4 w-4" />,
        status: currentProgress >= 100 ? 'complete' : currentProgress >= 90 ? 'active' : 'pending',
        progress: currentProgress >= 90 ? Math.min(((currentProgress - 90) / 10) * 100, 100) : 0
      }
    ];
  };

  const getQuestionTypeCount = () => {
    const types = new Set(Object.values(columnQuestionTypes));
    return types.size || 1;
  };

  if (!isProcessing && processingProgress === 0) {
    return null;
  }
  
  const steps = getProcessingSteps();
  const activeStep = steps.find(s => s.status === 'active');
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {processingProgress < 100 ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <span>Processing Status</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {selectedColumns.length} columns
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              {getQuestionTypeCount()} codeframe{getQuestionTypeCount() > 1 ? 's' : ''}
            </Badge>
            {isProcessing && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(elapsedTime)}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {processingStatus || (activeStep ? activeStep.name : 'Preparing...')}
            </span>
            <span className="font-medium">{processingProgress}%</span>
          </div>
          <Progress value={processingProgress} className="h-2" />
        </div>
        
        {/* Detailed steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full
                ${step.status === 'complete' ? 'bg-green-100 text-green-600' :
                  step.status === 'active' ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground'}
              `}>
                {step.status === 'complete' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : step.status === 'active' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  step.icon
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium
                    ${step.status === 'pending' ? 'text-muted-foreground' : ''}
                  `}>
                    {step.name}
                  </span>
                  {step.status === 'active' && (
                    <span className="text-xs text-muted-foreground">
                      {step.progress}%
                    </span>
                  )}
                </div>
                {step.status === 'active' && (
                  <Progress value={step.progress} className="h-1" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Additional info for specific statuses */}
        {processingStatus?.includes('Processing') && processingStatus?.includes('(') && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-xs text-blue-700">
              {processingStatus}
            </p>
          </div>
        )}
        
        {processingStatus?.includes('Completed') && (
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-xs text-green-700">
              {processingStatus}
            </p>
          </div>
        )}

        {processingStatus?.includes('Sampling') && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-xs text-blue-700">
              Processing a representative sample to generate comprehensive codeframes...
            </p>
          </div>
        )}

        {processingStatus?.includes('Rate limit') && (
          <div className="bg-orange-50 p-3 rounded-md">
            <p className="text-xs text-orange-700">
              Waiting for rate limit cooldown. Processing will resume automatically...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedProcessingStatus;