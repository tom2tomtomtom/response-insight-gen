
import React, { useState } from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Loader2, Download, RefreshCw, Filter, AlertCircle, BarChart } from 'lucide-react';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { ColumnInfo } from '../types';
import CodeSummaryChart from './CodeSummary';

const ResultsView: React.FC = () => {
  const { results, isGeneratingExcel, downloadResults, downloadOriginalWithCodes, resetState, fileColumns, apiConfig } = useProcessing();
  const [searchFilter, setSearchFilter] = useState('');
  const [columnFilter, setColumnFilter] = useState<string>('all');
  const [exportOption, setExportOption] = useState<'coded' | 'original'>('coded');
  
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

  // Handle export based on selected option
  const handleExport = () => {
    if (exportOption === 'original') {
      downloadOriginalWithCodes();
    } else {
      downloadResults();
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Analysis Results
          <Badge variant="outline" className="flex items-center gap-1">
            <BarChart className="h-4 w-4" />
            {results.codedResponses.length} Responses Coded
          </Badge>
        </CardTitle>
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
        {/* Add Code Summary Chart if we have code summary data */}
        {results.codeSummary && results.codeSummary.length > 0 && (
          <CodeSummaryChart codeSummary={results.codeSummary} />
        )}
      
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
                    <th>Numeric</th>
                    <th>Label</th>
                    <th>Definition</th>
                    <th>Examples</th>
                    <th>Count</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {results.codeframe.map(entry => (
                    <tr key={entry.code}>
                      <td className="font-medium">{entry.code}</td>
                      <td>{entry.numeric || '-'}</td>
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
                      <td className="text-center">{entry.count || 0}</td>
                      <td className="text-center">{entry.percentage ? `${entry.percentage.toFixed(1)}%` : '0%'}</td>
                    </tr>
                  ))}
                  {/* Add "Other" category if not already present */}
                  {!results.codeframe.some(code => code.code === "Other") && (
                    <tr>
                      <td className="font-medium">Other</td>
                      <td>0</td>
                      <td>Other responses</td>
                      <td>Responses that don't fit into the main categories</td>
                      <td>-</td>
                      <td className="text-center">0</td>
                      <td className="text-center">0%</td>
                    </tr>
                  )}
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
                          {response.codesAssigned.map(code => {
                            // Find the full code entry to get the numeric code
                            const codeEntry = results.codeframe.find(c => c.code === code);
                            return (
                              <span 
                                key={code} 
                                className="bg-primary/10 text-primary text-xs rounded px-2 py-0.5"
                                title={codeEntry?.label || code}
                              >
                                {codeEntry?.numeric || code}
                              </span>
                            );
                          })}
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
        
        <div className="flex gap-2">
          <Select
            value={exportOption}
            onValueChange={(value) => setExportOption(value as 'coded' | 'original')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select export type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coded">Coded responses only</SelectItem>
              <SelectItem value="original">Original data with codes</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleExport}
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
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResultsView;
