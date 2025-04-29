
import React from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import ColumnSelector from './ColumnSelector';

const FilePreview: React.FC = () => {
  const { uploadedFile, rawResponses, fileColumns } = useProcessing();
  
  if (!uploadedFile) {
    return null;
  }
  
  // If we have file columns, use the column selector
  if (fileColumns.length > 0) {
    return <ColumnSelector />;
  }
  
  // Fallback to the old preview if no column data
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>File Preview: {uploadedFile.filename}</span>
          <Badge variant="outline">{rawResponses.length} responses</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="table">
          <TabsList className="mb-4 w-full md:w-auto">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="text">Text View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="table">
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
          </TabsContent>
          
          <TabsContent value="text">
            <div className="space-y-2">
              {rawResponses.slice(0, 8).map((response, index) => (
                <div key={index} className="p-3 border rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">Response {index + 1}</div>
                  <div>{response}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FilePreview;
