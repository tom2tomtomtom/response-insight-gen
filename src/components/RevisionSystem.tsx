
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { 
  Edit3, 
  Lock, 
  Unlock, 
  Save, 
  RefreshCw, 
  Database, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';

const RevisionSystem: React.FC = () => {
  const { 
    results,
    isRefinementMode,
    isCodeframeFinalized,
    hasUnsavedChanges,
    toggleRefinementMode,
    finalizeCodeframe,
    unlockCodeframe,
    saveChanges,
    reprocessWithAI,
    applyToFullDataset
  } = useProcessing();

  const [revisionInstructions, setRevisionInstructions] = useState('');
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  const handleReprocessWithRevisions = async () => {
    if (!revisionInstructions.trim()) return;
    
    await reprocessWithAI();
    setRevisionInstructions('');
  };

  const handleFinalize = () => {
    finalizeCodeframe();
    setShowFinalizeDialog(false);
  };

  const handleApplyToFullDataset = () => {
    applyToFullDataset();
    setShowApplyDialog(false);
  };

  if (!results) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Codeframe Revision & Finalization
          </div>
          <div className="flex items-center gap-2">
            {isCodeframeFinalized ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Finalized
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <Unlock className="h-3 w-3" />
                Draft
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Manual Editing Mode</Label>
            <p className="text-sm text-muted-foreground">
              Enable direct editing of codeframe entries
            </p>
          </div>
          <Switch
            checked={isRefinementMode}
            onCheckedChange={toggleRefinementMode}
            disabled={isCodeframeFinalized}
          />
        </div>

        {!isCodeframeFinalized && (
          <>
            <div className="space-y-2">
              <Label>AI Revision Instructions</Label>
              <Textarea
                placeholder="Enter revision instructions (e.g., 'Merge codes A and B', 'Split code C into two categories', 'Rename code D to E')..."
                value={revisionInstructions}
                onChange={(e) => setRevisionInstructions(e.target.value)}
                className="min-h-[100px]"
              />
              <Button
                onClick={handleReprocessWithRevisions}
                disabled={!revisionInstructions.trim()}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reprocess with AI Revisions
              </Button>
            </div>

            {hasUnsavedChanges && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-orange-700">
                  You have unsaved changes. Save your edits before finalizing.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={saveChanges}
                variant="outline"
                disabled={!hasUnsavedChanges}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              
              <Button
                onClick={() => setShowFinalizeDialog(true)}
                disabled={hasUnsavedChanges}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalize Codeframe
              </Button>
            </div>
          </>
        )}

        {isCodeframeFinalized && (
          <>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Codeframe is finalized and ready for full dataset application.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={unlockCodeframe}
                variant="outline"
                className="flex-1"
              >
                <Unlock className="h-4 w-4 mr-2" />
                Unlock for Editing
              </Button>
              
              <Button
                onClick={() => setShowApplyDialog(true)}
                className="flex-1"
              >
                <Database className="h-4 w-4 mr-2" />
                Apply to Full Dataset
              </Button>
            </div>
          </>
        )}

        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Revision Process:</strong> Make manual edits or provide AI instructions. 
            Save changes, then finalize to lock the codeframe before applying to the full dataset.
          </p>
        </div>
      </CardContent>
      
      {/* Finalize Dialog */}
      <AlertDialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize Codeframe?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Once finalized:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>The codeframe will be locked and cannot be edited</li>
                <li>You can apply it to the full dataset</li>
                <li>You'll need to unlock it to make any changes</li>
              </ul>
              <p className="pt-2">Are you sure you want to finalize this codeframe?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize}>
              Finalize Codeframe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Apply to Full Dataset Dialog */}
      <AlertDialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply to Full Dataset?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This will:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Apply the finalized codeframe to all responses in your dataset</li>
                <li>Process responses that weren't included in the initial sample</li>
                <li>May take several minutes depending on dataset size</li>
              </ul>
              <p className="pt-2">Do you want to proceed with full dataset coding?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyToFullDataset}>
              Apply to Full Dataset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default RevisionSystem;
