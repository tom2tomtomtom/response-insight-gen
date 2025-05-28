
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
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

  const handleReprocessWithRevisions = async () => {
    if (!revisionInstructions.trim()) return;
    
    await reprocessWithAI();
    setRevisionInstructions('');
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
                onClick={finalizeCodeframe}
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
                onClick={applyToFullDataset}
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
    </Card>
  );
};

export default RevisionSystem;
