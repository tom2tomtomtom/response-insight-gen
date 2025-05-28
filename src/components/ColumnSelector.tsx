import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, ArrowRight, FileText, FileCode, Tag, CheckSquare, Lightbulb } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Alert, AlertDescription } from './ui/alert';

const QUESTION_TYPES = {
  "brand_awareness": "Unaided Brand Awareness",
  "brand_description": "Brand Description",
  "miscellaneous": "Miscellaneous"
};

interface ColumnSelectorProps {
  onContinueToAnalysis: () => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ onContinueToAnalysis }) => {
  const { 
    fileColumns, 
    selectedColumns, 
    toggleColumnSelection,
    selectMultipleColumns,
    uploadedFile, 
    searchQuery,
    setSearchQuery,
    activeCodeframe,
    columnQuestionTypes,
    setColumnQuestionType,
    columnSettings,
    updateColumnSetting
  } = useProcessing();
  
  if (!uploadedFile || fileColumns.length === 0) {
    return null;
  }
  
  // Only display text and mixed columns, filter out numeric columns
  const displayColumns = fileColumns.filter(
    col => col.type === 'text' || col.type === 'mixed'
  );
  
  const filteredColumns = displayColumns.filter(
    col => col.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const selectedCount = selectedColumns.length;
  const textColumnCount = displayColumns.length;

  // Check if all filtered columns are already selected
  const areAllFilteredSelected = filteredColumns.length > 0 &&
    filteredColumns.every(col => selectedColumns.includes(col.index));

  // Handle selecting or deselecting all filtered columns
  const handleSelectAllFiltered = () => {
    const filteredColumnIndices = filteredColumns.map(col => col.index);
    selectMultipleColumns(filteredColumnIndices, !areAllFilteredSelected);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleQuestionTypeChange = (columnIndex: number, questionType: string) => {
    setColumnQuestionType(columnIndex, questionType);
  };

  const handleNetsSettingChange = (columnIndex: number, hasNets: boolean) => {
    updateColumnSetting(columnIndex, "hasNets", hasNets);
  };

  const getSelectedTypes = () => {
    const types: Record<string, number> = {};
    
    selectedColumns.forEach(columnIndex => {
      const type = columnQuestionTypes[columnIndex] || "miscellaneous";
      types[type] = (types[type] || 0) + 1;
    });
    
    return Object.entries(types).map(([type, count]) => ({
      type,
      label: QUESTION_TYPES[type as keyof typeof QUESTION_TYPES],
      count
    }));
  };
  
  // Check if we have any non-miscellaneous question types selected
  const hasSpecializedQuestionTypes = selectedColumns.some(
    columnIndex => columnQuestionTypes[columnIndex] && columnQuestionTypes[columnIndex] !== "miscellaneous"
  );
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Select Text Response Columns</span>
          <Badge variant="outline" className="ml-2">
            {uploadedFile.filename}
          </Badge>
        </CardTitle>
        <CardDescription>
          We've identified {textColumnCount} text response columns. 
          Select columns and assign question types for analysis.
        </CardDescription>
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search columns..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          {filteredColumns.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllFiltered}
              className="shrink-0 flex items-center gap-1"
            >
              <CheckSquare className="h-4 w-4" />
              <span>{areAllFilteredSelected ? "Deselect All" : "Select All"}</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activeCodeframe && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-ellipsis overflow-hidden whitespace-nowrap">Using uploaded codeframe: {activeCodeframe.name}</span>
              <Badge variant="outline" className="ml-auto shrink-0">{activeCodeframe.entries.length} codes</Badge>
            </div>
          </div>
        )}
        
        {/* Insights Tips Alert */}
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Lightbulb className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            <span className="font-medium">Pro tip:</span> To get AI insights in your analysis, select at least one 
            <span className="font-medium"> Brand Awareness</span> or <span className="font-medium"> Brand Description</span> question.
            Analyzing only Miscellaneous questions won't generate insights.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredColumns.length > 0 ? (
              filteredColumns.map((column) => (
                <div
                  key={column.index}
                  className={`flex flex-col space-y-3 border rounded-md p-3 ${
                    column.type === 'text' ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100'
                  } ${selectedColumns.includes(column.index) ? 'ring-1 ring-primary' : ''}`}
                >
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id={`column-${column.index}`}
                      checked={selectedColumns.includes(column.index)}
                      onCheckedChange={() => toggleColumnSelection(column.index)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Label
                          htmlFor={`column-${column.index}`}
                          className="font-medium cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          {column.name || `Column ${column.index + 1}`}
                        </Label>
                        {column.type === 'text' && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Text
                          </Badge>
                        )}
                        {column.type === 'mixed' && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            Mixed
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                        {column.examples.length > 0 
                          ? column.examples[0]
                          : 'No data'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {column.stats.textLength > 0 && (
                          <span>Avg. length: {column.stats.textLength.toFixed(1)} chars • </span>
                        )}
                        {column.stats.textPercentage > 0 && (
                          <span>{column.stats.textPercentage.toFixed(0)}% text values</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedColumns.includes(column.index) && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor={`qtype-${column.index}`} className="text-xs text-muted-foreground">
                            Question Type
                          </Label>
                          <Select
                            value={columnQuestionTypes[column.index] || "miscellaneous"}
                            onValueChange={(value) => handleQuestionTypeChange(column.index, value)}
                          >
                            <SelectTrigger id={`qtype-${column.index}`} className="h-8 text-xs w-[180px]">
                              <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="brand_awareness">Unaided Brand Awareness</SelectItem>
                              <SelectItem value="brand_description">Brand Description</SelectItem>
                              <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Label 
                              htmlFor={`nets-${column.index}`} 
                              className="text-xs text-muted-foreground"
                            >
                              Requires Nets/Sub-nets
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    <Tag className="h-3 w-3 text-muted-foreground" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="w-[200px] text-xs">
                                  Enable this for hierarchical categories like brand systems that need grouping
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Checkbox
                            id={`nets-${column.index}`}
                            checked={columnSettings[column.index]?.hasNets || false}
                            onCheckedChange={(checked) => handleNetsSettingChange(column.index, !!checked)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 p-6 text-center text-muted-foreground">
                No columns match your search
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col md:flex-row justify-between items-center border-t p-4 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="text-sm text-muted-foreground flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span>{selectedCount} column{selectedCount !== 1 ? 's' : ''} selected</span>
          </div>
          
          {selectedCount > 0 && getSelectedTypes().length > 0 && (
            <div className="flex gap-1 items-center">
              {getSelectedTypes().map(typeInfo => (
                <Badge key={typeInfo.type} variant="outline" className="text-xs">
                  {typeInfo.label}: {typeInfo.count}
                </Badge>
              ))}
            </div>
          )}
          
          {!activeCodeframe && (
            <Button variant="outline" size="sm" asChild className="ml-auto md:ml-0">
              <Link to="/upload-codeframe" className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                <span>Upload Codeframe</span>
              </Link>
            </Button>
          )}
        </div>
        
        {!hasSpecializedQuestionTypes && selectedCount > 0 && (
          <div className="text-xs text-amber-600 flex items-center gap-1 mb-2 md:mb-0">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Select specialized question types for AI insights</span>
          </div>
        )}
        
        <Button 
          onClick={onContinueToAnalysis}
          disabled={selectedCount === 0} 
          className="space-x-2 w-full md:w-auto"
        >
          <ArrowRight className="h-4 w-4" />
          <span>Continue to Analysis</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ColumnSelector;
