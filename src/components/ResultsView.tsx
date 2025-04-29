
import React from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Loader2, Download, RefreshCw } from 'lucide-react';

const ResultsView: React.FC = () => {
  const { results, isGeneratingExcel, downloadResults, resetState } = useProcessing();
  
  if (!results) {
    return null;
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="codeframe">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="codeframe">Codeframe</TabsTrigger>
            <TabsTrigger value="responses">Coded Responses</TabsTrigger>
          </TabsList>
          
          <TabsContent value="codeframe" className="mt-4">
            <div className="overflow-x-auto">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Label</th>
                    <th>Definition</th>
                    <th>Examples</th>
                  </tr>
                </thead>
                <tbody>
                  {results.codeframe.map(entry => (
                    <tr key={entry.code}>
                      <td className="font-medium">{entry.code}</td>
                      <td>{entry.label}</td>
                      <td>{entry.definition}</td>
                      <td>
                        <ul className="list-disc list-inside">
                          {entry.examples.slice(0, 2).map((example, i) => (
                            <li key={i} className="text-sm">{example}</li>
                          ))}
                          {entry.examples.length > 2 && (
                            <li className="text-xs text-muted-foreground">
                              +{entry.examples.length - 2} more
                            </li>
                          )}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="responses" className="mt-4">
            <div className="overflow-x-auto">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th>Response</th>
                    <th>Assigned Codes</th>
                  </tr>
                </thead>
                <tbody>
                  {results.codedResponses.map((response, index) => (
                    <tr key={index}>
                      <td>{response.responseText}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {response.codesAssigned.map(code => (
                            <span 
                              key={code} 
                              className="bg-primary/10 text-primary text-xs rounded px-2 py-0.5"
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetState} className="space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Start New Analysis</span>
        </Button>
        
        <Button 
          onClick={downloadResults}
          disabled={isGeneratingExcel}
          className="space-x-2"
        >
          {isGeneratingExcel ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download Excel</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResultsView;
