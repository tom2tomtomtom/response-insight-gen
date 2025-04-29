
import React from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Loader2, Play } from 'lucide-react';

// Mock data for preview
const mockResponseData = [
  { id: 1, response: "The product is very easy to use and intuitive. I didn't need any training." },
  { id: 2, response: "Customer support was excellent when I had questions." },
  { id: 3, response: "The price point is fair for the features offered." },
  { id: 4, response: "I wish it had better integration with other tools we use." },
  { id: 5, response: "Performance has been excellent even with large datasets." },
  { id: 6, response: "The export functionality saves me hours of work every week." },
  { id: 7, response: "The interface could be more modern, but it's functional." },
  { id: 8, response: "Very reliable, hasn't crashed once in six months of use." }
];

const FilePreview: React.FC = () => {
  const { uploadedFile, isProcessing, startProcessing } = useProcessing();
  
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
              {mockResponseData.map(row => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <p className="text-muted-foreground text-sm mt-4">
            Displaying 8 of {Math.floor(Math.random() * 50) + 20} responses
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
