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
import CodeSummaryChart from './CodeSummary';
import { toast } from './ui/use-toast';
import { getQuestionTypeName, getQuestionTypeIcon } from '../utils/questionTypes';
import InsightsPanel from './InsightsPanel';
import CodeframeTable from './results/CodeframeTable';
import BrandHierarchyTable from './results/BrandHierarchyTable';
import AttributeThemesTable from './results/AttributeThemesTable';
import CodedResponsesTable from './results/CodedResponsesTable';
import StudyOutputFormat from './StudyOutputFormat';
import BinaryCodedMatrix from './BinaryCodedMatrix';
import PartialResultsRecovery from './PartialResultsRecovery';
import FinalizeCodeframe from './FinalizeCodeframe';
import CodeframeRefinement from './CodeframeRefinement';

const ResultsView: React.FC = () => {
  const { 
    results, 
    isGeneratingExcel, 
    downloadResults, 
    resetState, 
    fileColumns, 
    apiConfig,
    rawFileData,
    multipleCodeframes,
    insights,
    downloadBinaryMatrix,
    isRefinementMode,
    toggleRefinementMode,
    refineCodeframe,
    isCodeframeFinalized
  } = useProcessing();
  
  const [searchFilter, setSearchFilter] = useState('');
  const [columnFilter, setColumnFilter] = useState<string>('all');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<string>('all');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string | null>(null);
  
  if (!results) {
    return null;
  }

  // Check if we have multiple codeframes
  const hasMultipleCodeframes = multipleCodeframes && Object.keys(multipleCodeframes).length > 0;
  
  // Set default selected question type if not already set
  if (hasMultipleCodeframes && !selectedQuestionType) {
    setSelectedQuestionType(Object.keys(multipleCodeframes)[0]);
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
  
  // Get available question types
  const availableQuestionTypes = hasMultipleCodeframes ? 
    Object.keys(multipleCodeframes).map(key => ({
      id: key,
      name: getQuestionTypeName(key)
    })) : [];
  
  // Get the currently selected codeframe and summary
  const currentCodeframe = hasMultipleCodeframes && selectedQuestionType ? 
    multipleCodeframes[selectedQuestionType].codeframe : 
    results.codeframe;
    
  const currentCodeSummary = hasMultipleCodeframes && selectedQuestionType ? 
    multipleCodeframes[selectedQuestionType].codeSummary : 
    results.codeSummary;
  
  // Apply filters to the coded responses
  const filteredResponses = results.codedResponses.filter(response => {
    // Apply text search filter
    const matchesSearch = !searchFilter || 
      response.responseText.toLowerCase().includes(searchFilter.toLowerCase());
    
    // Apply column filter
    const matchesColumn = columnFilter === 'all' || 
      (response.columnIndex !== undefined && 
       response.columnIndex.toString() === columnFilter);
    
    // Apply question type filter if available
    let matchesQuestionType = true;
    if (hasMultipleCodeframes && questionTypeFilter !== 'all') {
      const responseType = response.columnIndex !== undefined ? 
        multipleCodeframes[questionTypeFilter]?.codeframe?.some(
          (code: any) => response.codesAssigned.includes(code.code)
        ) : false;
      matchesQuestionType = responseType;
    }
    
    return matchesSearch && matchesColumn && matchesQuestionType;
  });

  // Handle export with improved error handling and user feedback
  const handleExport = async () => {
    if (isGeneratingExcel) {
      return; // Prevent multiple clicks
    }
    
    try {
      toast({
        title: "Generating Excel File",
        description: "Please wait while we prepare your download...",
      });
      
      await downloadResults();
      
      toast({
        title: "Download Complete",
        description: "Your Excel file has been generated successfully.",
      });
    } catch (error) {
      console.error("Export failed:", error);
      
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: error instanceof Error 
          ? error.message 
          : "There was an error generating the Excel file.",
        duration: 10000,
      });
    }
  };
  
  return (
    <div className="w-full space-y-4">
      {/* Show partial results recovery if applicable */}
      <PartialResultsRecovery 
        onRetryComplete={(newResults) => {
          // The results will be handled by the processing context
          toast({
            title: "Results Updated",
            description: "The new results have been loaded successfully.",
          });
        }}
      />
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Analysis Results
            <div className="flex items-center gap-2">
              {results.status === 'partial' && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-300">
                  Partial Results
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <BarChart className="h-4 w-4" />
                {results.codedResponses.length} Responses Coded
              </Badge>
            </div>
          </CardTitle>
        {!apiConfig?.isConfigured && (
          <Alert className="mt-2 border-orange-300 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <AlertTitle>Demo Results</AlertTitle>
            <AlertDescription>
              You're viewing demo results. For real analysis, please configure an API key.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Question Type Selector (only if multiple question types exist) */}
        {hasMultipleCodeframes && (
          <div className="mt-4">
            <Select
              value={selectedQuestionType || ''}
              onValueChange={setSelectedQuestionType}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select question type to view" />
              </SelectTrigger>
              <SelectContent>
                {availableQuestionTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Show insights if available */}
        {insights && <InsightsPanel insights={insights} />}
      
        {/* Add Code Summary Chart if we have code summary data */}
        {currentCodeSummary && currentCodeSummary.length > 0 && (
          <CodeSummaryChart codeSummary={currentCodeSummary} />
        )}
        
        {/* Finalize Codeframe Component */}
        <FinalizeCodeframe 
          codeframeCount={currentCodeframe.length}
          codedResponsesCount={results.codedResponses?.length || 0}
          totalResponsesCount={rawFileData ? rawFileData.length - 1 : 0}
        />
      
        <Tabs defaultValue="output-format">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="output-format">Output Format</TabsTrigger>
            <TabsTrigger value="codeframe">Codeframe</TabsTrigger>
            <TabsTrigger value="responses">Coded Responses</TabsTrigger>
            <TabsTrigger value="binary-matrix">Binary Matrix</TabsTrigger>
          </TabsList>
          
          <TabsContent value="output-format" className="mt-4">
            <StudyOutputFormat results={results} />
          </TabsContent>
          
          <TabsContent value="codeframe" className="mt-4">
            {/* Display hierarchies or themes if available */}
            {hasMultipleCodeframes && selectedQuestionType && (
              <>
                {/* Display brand hierarchies for brand awareness questions */}
                {selectedQuestionType === 'brand_awareness' && 
                 multipleCodeframes[selectedQuestionType].brandHierarchies && (
                  <BrandHierarchyTable 
                    hierarchies={multipleCodeframes[selectedQuestionType].brandHierarchies}
                    codeframe={currentCodeframe} 
                  />
                )}
                
                {/* Display attribute themes for brand description questions */}
                {selectedQuestionType === 'brand_description' && 
                 multipleCodeframes[selectedQuestionType].attributeThemes && (
                  <AttributeThemesTable 
                    themes={multipleCodeframes[selectedQuestionType].attributeThemes}
                    codeframe={currentCodeframe} 
                  />
                )}
              </>
            )}
            
            <div className="space-y-4">
              <CodeframeRefinement
                codeframe={currentCodeframe}
                onRefine={refineCodeframe}
                isRefinementMode={isRefinementMode}
                onToggleRefinement={toggleRefinementMode}
              />
              {!isRefinementMode && (
                <CodeframeTable codeframe={currentCodeframe} />
              )}
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
              
              {hasMultipleCodeframes && (
                <div className="w-full md:w-48">
                  <label className="text-sm text-muted-foreground mb-2 block">Filter by question type</label>
                  <Select 
                    value={questionTypeFilter}
                    onValueChange={setQuestionTypeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All question types</SelectItem>
                      {availableQuestionTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Badge variant="secondary">
                  {filteredResponses.length} responses
                </Badge>
              </div>
            </div>
            
            <CodedResponsesTable 
              responses={filteredResponses}
              hasMultipleCodeframes={hasMultipleCodeframes}
              codeframe={results.codeframe}
              multipleCodeframes={multipleCodeframes}
            />
          </TabsContent>
          
          <TabsContent value="binary-matrix" className="mt-4">
            <BinaryCodedMatrix 
              codeframe={currentCodeframe}
              codedResponses={filteredResponses}
              onDownloadMatrix={downloadBinaryMatrix}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col md:flex-row justify-between gap-4">
        <Button variant="outline" onClick={resetState} className="space-x-2 w-full md:w-auto">
          <RefreshCw className="h-4 w-4" />
          <span>Start New Analysis</span>
        </Button>
        
        <Button 
          onClick={handleExport}
          disabled={isGeneratingExcel}
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
      </CardFooter>
    </Card>
    </div>
  );
};

export default ResultsView;
