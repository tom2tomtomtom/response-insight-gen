import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { useProcessing } from '../contexts/ProcessingContext';
import { Lock, Unlock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { toast } from './ui/use-toast';

interface FinalizeCodeframeProps {
  codeframeCount: number;
  codedResponsesCount: number;
  totalResponsesCount: number;
}

const FinalizeCodeframe: React.FC<FinalizeCodeframeProps> = ({
  codeframeCount,
  codedResponsesCount,
  totalResponsesCount
}) => {
  const { 
    isCodeframeFinalized, 
    finalizeCodeframe, 
    unlockCodeframe,
    hasUnsavedChanges,
    processingResult,
    startProcessing
  } = useProcessing();
  
  const [isApplying, setIsApplying] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);

  const coveragePercentage = totalResponsesCount > 0 
    ? Math.round((codedResponsesCount / totalResponsesCount) * 100) 
    : 0;

  const handleFinalize = async () => {
    finalizeCodeframe();
    setShowFinalizeDialog(false);
    
    // If less than 100% coverage, offer to apply to all
    if (coveragePercentage < 100) {
      toast({
        title: "Apply to Full Dataset?",
        description: `Current coverage is ${coveragePercentage}%. Would you like to apply the codeframe to all ${totalResponsesCount} responses?`,
        action: (
          <Button size="sm" onClick={handleApplyToAll}>
            Apply to All
          </Button>
        )
      });
    }
  };

  const handleApplyToAll = async () => {
    setIsApplying(true);
    try {
      // Start processing with full dataset flag
      await startProcessing({ applyToFullDataset: true });
      
      toast({
        title: "Processing Complete",
        description: `Codeframe applied to all ${totalResponsesCount} responses.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Application Failed",
        description: error instanceof Error ? error.message : "Failed to apply codeframe to full dataset"
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleUnlock = () => {
    unlockCodeframe();
    setShowUnlockDialog(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Codeframe Status</span>
          <Badge variant={isCodeframeFinalized ? "default" : "secondary"}>
            {isCodeframeFinalized ? (
              <>
                <Lock className="h-3 w-3 mr-1" />
                Finalized
              </>
            ) : (
              <>
                <Unlock className="h-3 w-3 mr-1" />
                In Progress
              </>
            )}
          </Badge>
        </CardTitle>
        <CardDescription>
          Manage your codeframe finalization and dataset application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coverage Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{codeframeCount}</p>
            <p className="text-sm text-muted-foreground">Codes Created</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{codedResponsesCount}</p>
            <p className="text-sm text-muted-foreground">Responses Coded</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{coveragePercentage}%</p>
            <p className="text-sm text-muted-foreground">Coverage</p>
          </div>
        </div>

        {/* Coverage Alert */}
        {coveragePercentage < 100 && !isCodeframeFinalized && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Partial Coverage</AlertTitle>
            <AlertDescription>
              Only {coveragePercentage}% of responses have been processed. 
              Finalize the codeframe to apply it to the remaining {totalResponsesCount - codedResponsesCount} responses.
            </AlertDescription>
          </Alert>
        )}

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unsaved Changes</AlertTitle>
            <AlertDescription>
              You have unsaved changes. Please save or discard them before finalizing.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isCodeframeFinalized ? (
            <>
              {/* Finalize Button */}
              <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className="flex-1"
                    disabled={hasUnsavedChanges || codeframeCount === 0}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Finalize Codeframe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Finalize Codeframe?</DialogTitle>
                    <DialogDescription>
                      Once finalized, the codeframe will be locked and cannot be edited without unlocking.
                      This ensures consistency when applying to the full dataset.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-2">This will:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Lock all {codeframeCount} codes from editing</li>
                      <li>Enable application to the full dataset</li>
                      <li>Preserve the current codeframe version</li>
                    </ul>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowFinalizeDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleFinalize}>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalize
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Apply to Sample Button */}
              {coveragePercentage < 100 && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleApplyToAll}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Apply to All Data
                    </>
                  )}
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Unlock Button */}
              <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock for Editing
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Unlock Codeframe?</DialogTitle>
                    <DialogDescription>
                      Unlocking will allow you to edit the codeframe again. 
                      You'll need to reprocess the data after making changes.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowUnlockDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleUnlock}>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Reapply Button */}
              {coveragePercentage < 100 && (
                <Button 
                  className="flex-1"
                  onClick={handleApplyToAll}
                  disabled={isApplying}
                >
                  {isApplying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Apply to Remaining {totalResponsesCount - codedResponsesCount} Responses
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Status Message */}
        {isCodeframeFinalized && coveragePercentage === 100 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Fully Applied</AlertTitle>
            <AlertDescription className="text-green-800">
              The finalized codeframe has been applied to all {totalResponsesCount} responses.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default FinalizeCodeframe;