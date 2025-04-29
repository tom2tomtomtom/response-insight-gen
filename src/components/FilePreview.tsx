
import React from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Loader2, Play } from 'lucide-react';

const FilePreview: React.FC = () => {
  const { uploadedFile, isProcessing, startProcessing, rawResponses } = useProcessing();
  
  if (!uploadedFile) {
    return null;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>File Preview: {uploadedFile.filename}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="excel-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {rawResponses.slice(0, 8).map((response, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{response}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <p className="text-muted-foreground text-sm mt-4">
            Displaying {Math.min(8, rawResponses.length)} of {rawResponses.length} responses
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={startProcessing}
          disabled={isProcessing}
          className="space-x-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>Process Responses</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FilePreview;
