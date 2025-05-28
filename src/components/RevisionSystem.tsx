
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshCw, Lock, Unlock, Save, AlertCircle } from 'lucide-react';
import { CodeframeEntry } from '../types';

interface RevisionSystemProps {
  codeframe: CodeframeEntry[];
  isFinalized: boolean;
  onReprocess: () => Promise<void>;
  onFinalize: () => void;
  onUnlock: () => void;
  hasUnsavedChanges: boolean;
  onSave: () => void;
}

const RevisionSystem: React.FC<RevisionSystemProps> = ({
  codeframe,
  isFinalized,
  onReprocess,
  onFinalize,
  onUnlock,
  hasUnsavedChanges,
  onSave
}) => {
  const [isReprocessing, setIsReprocessing] = useState(false);

  const handleReprocess = async () => {
    setIsReprocessing(true);
    try {
      await onReprocess();
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isFinalized ? (
              <Lock className="h-5 w-5 text-green-600" />
            ) : (
              <Unlock className="h-5 w-5 text-orange-600" />
            )}
            Codeframe Status
          </div>
          <Badge variant={isFinalized ? "default" : "secondary"}>
            {isFinalized ? "Finalized" : "Draft"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasUnsavedChanges && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Save your work before finalizing or reprocessing.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              onClick={onSave}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          )}

          {!isFinalized && (
            <>
              <Button
                variant="outline"
                onClick={handleReprocess}
                disabled={isReprocessing || hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                {isReprocessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Reprocess with AI
              </Button>

              <Button
                onClick={onFinalize}
                disabled={hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Finalize Codeframe
              </Button>
            </>
          )}

          {isFinalized && (
            <Button
              variant="outline"
              onClick={onUnlock}
              className="flex items-center gap-2"
            >
              <Unlock className="h-4 w-4" />
              Unlock for Editing
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Draft: Codeframe can be edited and reprocessed</p>
          <p>• Finalized: Codeframe is locked and ready for full dataset application</p>
          <p>• Reprocessing will incorporate manual edits into AI suggestions</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevisionSystem;
