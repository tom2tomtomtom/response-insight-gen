
import React from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import ColumnSelector from './ColumnSelector';

const FilePreview: React.FC = () => {
  const { uploadedFile, rawResponses, fileColumns, apiConfig } = useProcessing();
  
  if (!uploadedFile) {
    return null;
  }

  // Show API key requirement if not configured
  if (!apiConfig?.isConfigured) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>File Uploaded: {uploadedFile.filename}</span>
            <Badge variant="outline">{rawResponses.length} responses</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please configure your OpenAI API key first to proceed with analysis. Scroll up to the "OpenAI API Key Required" section.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // If we have file columns and API is configured, use the column selector
  if (fileColumns.length > 0) {
    return <ColumnSelector onContinueToAnalysis={() => {}} />;
  }
  
  // Fallback message
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>File Preview: {uploadedFile.filename}</span>
          <Badge variant="outline">{rawResponses.length} responses</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            File uploaded successfully. Please configure your API key to continue with analysis.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default FilePreview;
