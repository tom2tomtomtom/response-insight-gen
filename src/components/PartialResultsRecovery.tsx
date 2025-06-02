import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from './ui/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Download,
  Trash2
} from 'lucide-react';
import { 
  getPartialResults, 
  clearPartialResults, 
  retryFailedQuestionTypes 
} from '../services/api';
import { useProcessing } from '../contexts/ProcessingContext';

interface PartialResultsRecoveryProps {
  onRetryComplete?: (results: any) => void;
}

const PartialResultsRecovery: React.FC<PartialResultsRecoveryProps> = ({ onRetryComplete }) => {
  const { apiConfig, results, isProcessing, refineCodeframe } = useProcessing();
  const [partialData, setPartialData] = useState<ReturnType<typeof getPartialResults>>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Check for partial results on mount and when processing status changes
    const data = getPartialResults();
    setPartialData(data);
  }, [isProcessing, results]);

  const handleRetry = async () => {
    if (!partialData || !apiConfig?.apiKey) return;

    setIsRetrying(true);
    try {
      const response = await retryFailedQuestionTypes(
        partialData.failed,
        partialData.columnsByType,
        { apiKey: apiConfig.apiKey, apiUrl: apiConfig.apiUrl }
      );

      if (response.success && response.data) {
        // Merge retry results with existing results
        if (results) {
          const mergedResults = {
            ...results,
            codedResponses: [...results.codedResponses, ...response.data.codedResponses],
            multipleCodeframes: {
              ...results.multipleCodeframes,
              ...response.data.multipleCodeframes
            },
            status: response.data.status,
            processingDetails: response.data.processingDetails
          };
          
          // Update the results using refineCodeframe
          refineCodeframe(mergedResults.codeframe);
        }
        
        toast({
          title: "Retry Complete",
          description: `Successfully processed ${response.data.processingDetails?.successfulTypes || 0} of ${partialData.failed.length} failed question types`,
        });

        if (onRetryComplete) {
          onRetryComplete(response.data);
        }

        // Clear partial results if all succeeded
        if (response.data.status === 'complete') {
          clearPartialResults();
          setPartialData(null);
        } else {
          // Update partial data with remaining failures
          const updatedData = getPartialResults();
          setPartialData(updatedData);
        }
      } else {
        throw new Error(response.error || 'Retry failed');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Retry Failed",
        description: error instanceof Error ? error.message : "Failed to retry processing",
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleClear = () => {
    clearPartialResults();
    setPartialData(null);
    toast({
      title: "Cleared",
      description: "Partial results have been cleared",
    });
  };

  const handleUsePartialResults = () => {
    toast({
      title: "Using Partial Results",
      description: "You can download the successfully processed results using the download buttons below",
    });
  };

  // Don't show if no partial results or if actively processing
  if (!partialData || isProcessing) return null;

  // Don't show if we already have complete results
  if (results?.status === 'complete') return null;

  const timeSince = new Date(partialData.timestamp);
  const hoursAgo = Math.round((Date.now() - timeSince.getTime()) / (1000 * 60 * 60));

  return (
    <Alert className="mb-6 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Partial Processing Results Available</AlertTitle>
      <AlertDescription className="space-y-4">
        <p className="text-sm text-orange-700">
          A previous processing attempt completed partially ({hoursAgo} hour{hoursAgo !== 1 ? 's' : ''} ago).
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-medium text-green-700">
              <CheckCircle className="inline h-4 w-4 mr-1" />
              Successful ({partialData.successful.length})
            </div>
            {partialData.successful.map((s, idx) => (
              <div key={idx} className="ml-5 text-green-600">
                • {s.questionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <div className="font-medium text-red-700">
              <XCircle className="inline h-4 w-4 mr-1" />
              Failed ({partialData.failed.length})
            </div>
            {partialData.failed.map((f, idx) => (
              <div key={idx} className="ml-5 space-y-1">
                <div className="text-red-600">
                  • {f.questionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                <div className="ml-3 text-xs text-red-500">
                  {f.error}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
          >
            {isRetrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Retry Failed Types
          </Button>
          
          <Button
            onClick={handleUsePartialResults}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Use Partial Results
          </Button>
          
          <Button
            onClick={handleClear}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default PartialResultsRecovery;