import React, { useState, useEffect } from 'react';
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
import { toast } from './ui/use-toast';

const ResultsView: React.FC = () => {
  const { 
    results, 
    isGeneratingExcel, 
    downloadResults, 
    downloadOriginalWithCodes, 
    resetState, 
    fileColumns, 
    apiConfig,
    rawFileData 
  } = useProcessing();
  const [searchFilter, setSearchFilter] = useState('');
  const [columnFilter, setColumnFilter] = useState<string>('all');
  const [exportOption, setExportOption] = useState<'coded' | 'original'>('coded');
  const [rawDataInfo, setRawDataInfo] = useState<{rows: number, size: string} | null>(null);
  
  // Calculate and set raw data stats
  useEffect(() => {
    if (rawFileData && Array.isArray(rawFileData)) {
      try {
        // Count rows
        const rows = rawFileData.length;
        
        // Simple size estimation based on row count and average row size
        const avgRowSizeBytes = 200; // Conservative estimate
        const estimatedSize = rows * avgRowSizeBytes;
        
        // Format size in KB or MB
        let sizeString: string;
        if (estimatedSize > 1048576) {
          sizeString = `~${(estimatedSize / 1048576).toFixed(1)} MB`;
        } else {
          sizeString = `~${(estimatedSize / 1024).toFixed(0)} KB`;
        }
        
        setRawDataInfo({ rows, size: sizeString });
      } catch (error) {
        console.error("Error calculating raw data stats:", error);
      }
    }
  }, [rawFileData]);
  
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

  // Handle export with improved error handling and user feedback
  const handleExport = async () => {
    if (isGeneratingExcel) {
      return; // Prevent multiple clicks
    }
    
    try {
      // Validate before export - especially important for original data
      if (exportOption === 'original') {
        if (!rawFileData || !Array.isArray(rawFileData) || rawFileData.length === 0) {
          throw new Error("Original data not available for export. Please try the 'Coded responses only' option.");
        }
        
        // Show file size warning for large files
        if (rawFileData.length > 5000) {
          const warningText = `You're exporting a large file (${rawDataInfo?.rows.toLocaleString()} rows, ${rawDataInfo?.size}). This may take a while.`;
          
          toast({
            title: "Large File Warning",
            description: warningText,
            duration: 6000,
          });
        }
        
        // Additional warning for extremely large files
        if (rawFileData.length > 20000) {
          toast({
            variant: "destructive",  
            title: "Very Large File Warning",
            description: "Your file is extremely large and may cause issues. Consider using 'Coded responses only' option instead.",
            duration: 8000,
          });
        }
        
        toast({
          title: "Generating Excel File",
          description: "Please wait while we prepare your download with original data...",
        });
        
        console.log("Starting original data export", {
          rawFileDataLength: rawFileData.length,
          resultsAvailable: !!results,
          codedResponsesCount: results?.codedResponses?.length || 0
        });
        
        await downloadOriginalWithCodes();
      } else {
        // Standard export - simpler
        toast({
          title: "Generating Excel File",
          description: "Please wait while we prepare your download...",
        });
        
        await downloadResults();
      }
      
      toast({
        title: "Download Complete",
        description: "Your Excel file has been generated successfully.",
      });
    } catch (error) {
      console.error("Export failed:", error);
      
      // More helpful error message
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error instanceof Error 
          ? error.message 
          : "There was an error generating the Excel file. Please try with 'Coded responses only' option.",
        duration: 10000,
      });
    }
  };
  
  // More robust check for original data export availability
  const hasRawFileData = rawFileData && Array.isArray(rawFileData) && rawFileData.length > 0;
  const originalExportAvailable = hasRawFileData;
  
  // Flag for very large datasets
  const isLargeDataset = rawFileData && Array.isArray(rawFileData) && rawFileData.length > 10000;
  
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
      <CardFooter className="flex flex-col md:flex-row justify-between gap-4">
        <Button variant="outline" onClick={resetState} className="space-x-2 w-full md:w-auto">
          <RefreshCw className="h-4 w-4" />
          <span>Start New Analysis</span>
        </Button>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Select
            value={exportOption}
            onValueChange={(value) => setExportOption(value as 'coded' | 'original')}
          >
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Select export type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coded">Coded responses only</SelectItem>
              <SelectItem value="original" disabled={!originalExportAvailable}>
                Original data with codes
                {!originalExportAvailable && " (unavailable)"}
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Warning for large dataset export */}
          {isLargeDataset && exportOption === 'original' && (
            <Alert variant="warning" className="mt-2 mb-2 p-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm">Large Dataset Warning</AlertTitle>
              <AlertDescription className="text-xs">
                You're exporting a large file ({rawDataInfo?.rows.toLocaleString()} rows, {rawDataInfo?.size}). 
                This may cause performance issues.
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleExport}
            disabled={isGeneratingExcel || (exportOption === 'original' && !originalExportAvailable)}
            className="space-x-2 w-full md:w-auto"
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
