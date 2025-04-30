
import React, { useState } from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Loader2, Download, RefreshCw, Filter, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { ColumnInfo } from '../types';

const ResultsView: React.FC = () => {
  const { results, isGeneratingExcel, downloadResults, resetState, fileColumns, apiConfig } = useProcessing();
  const [searchFilter, setSearchFilter] = useState('');
  const [columnFilter, setColumnFilter] = useState<string>('all');
  
  if (!results) {
    return null;
  }

  // Get available columns from the results
  const availableColumns = [...new Set(
    results.codedResponses
      .filter(r => r.columnName)
      .map(r => ({
        name: r.columnName || 'Unknown',
        index: r.columnIndex !== undefined ? r.columnIndex : -1
      }))
  )];
  
  // Apply filters to the coded responses
  const filteredResponses = results.codedResponses.filter(response => {
    // Apply text search filter
    const matchesSearch = !searchFilter || 
      response.responseText.toLowerCase().includes(searchFilter.toLowerCase());
    
    // Apply column filter
    const matchesColumn = columnFilter === 'all' || 
      (response.columnIndex !== undefined && 
       response.columnIndex.toString() === columnFilter);
    
    return matchesSearch && matchesColumn;
  });
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
        {!apiConfig?.isConfigured && (
          <Alert variant="warning" className="mt-2 border-orange-300 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertTitle>Demo Results</AlertTitle>
            <AlertDescription>
              You're viewing demo results. For real analysis, please configure an API key.
            </AlertDescription>
          </Alert>
        )}
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
            <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-2 block">Search responses</label>
                <Input
                  placeholder="Search by response text..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
              
              <div className="w-full md:w-48">
                <label className="text-sm text-muted-foreground mb-2 block">Filter by column</label>
                <Select 
                  value={columnFilter}
                  onValueChange={setColumnFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All columns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All columns</SelectItem>
                    {availableColumns.map(column => (
                      <SelectItem key={column.index} value={column.index.toString()}>
                        {column.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Badge variant="secondary">
                  {filteredResponses.length} responses
                </Badge>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th>Response</th>
                    <th>Column</th>
                    <th>Assigned Codes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResponses.map((response, index) => (
                    <tr key={index}>
                      <td>{response.responseText}</td>
                      <td>
                        {response.columnName || 'Unknown'}
                      </td>
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
              
              {filteredResponses.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  No responses match your filters
                </div>
              )}
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
