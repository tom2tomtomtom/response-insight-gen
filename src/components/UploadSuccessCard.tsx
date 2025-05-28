
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle, FileText, Database, Trash2 } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';

const UploadSuccessCard: React.FC = () => {
  const { uploadedFile, fileColumns, resetState } = useProcessing();

  if (!uploadedFile || !fileColumns) {
    return null;
  }

  const textColumns = fileColumns.filter(col => col.type === 'text' || col.type === 'mixed');
  const totalColumns = fileColumns.length;

  return (
    <Card className="w-full bg-green-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          File Successfully Uploaded
        </CardTitle>
        <CardDescription>
          Your file has been analyzed and is ready for column selection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="font-medium">{uploadedFile.filename}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetState}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove File
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span>Total Columns: <Badge variant="outline">{totalColumns}</Badge></span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" />
              <span>Text Columns: <Badge variant="outline">{textColumns.length}</Badge></span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-white rounded p-2 border">
            <strong>Next step:</strong> Select the columns below that contain open-ended responses you want to analyze.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadSuccessCard;
