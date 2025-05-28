import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Search, Play, FileText, FileCode, Tag, CheckSquare, Lightbulb, Upload } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';

const QUESTION_TYPES = {
  "brand_awareness": "Unaided Brand Awareness",
  "brand_description": "Brand Description", 
  "miscellaneous": "Miscellaneous"
};

interface ColumnQuestionConfig {
  questionType: string;
  fullQuestionText: string;
  hasExistingCodeframe: boolean;
  codeframeFile?: File;
}

const EnhancedColumnSelector: React.FC = () => {
  const { 
    fileColumns, 
    selectedColumns, 
    toggleColumnSelection,
    selectMultipleColumns,
    startProcessing, 
    uploadedFile, 
    searchQuery,
    setSearchQuery,
    activeCodeframe,
    columnQuestionTypes,
    setColumnQuestionType,
    columnSettings,
    updateColumnSetting
  } = useProcessing();
  
  const [columnConfigs, setColumnConfigs] = useState<Record<number, ColumnQuestionConfig>>({});
  const [allowMultiSelection, setAllowMultiSelection] = useState(false);
  
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
    setColumnConfigs(prev => ({
      ...prev,
      [columnIndex]: {
        ...prev[columnIndex],
        questionType
      }
    }));
  };

  const handleQuestionTextChange = (columnIndex: number, text: string) => {
    setColumnConfigs(prev => ({
      ...prev,
      [columnIndex]: {
        ...prev[columnIndex],
        fullQuestionText: text
      }
    }));
  };

  const handleExistingCodeframeToggle = (columnIndex: number, hasExisting: boolean) => {
    setColumnConfigs(prev => ({
      ...prev,
      [columnIndex]: {
        ...prev[columnIndex],
        hasExistingCodeframe: hasExisting
      }
    }));
  };

  const handleCodeframeFileUpload = (columnIndex: number, file: File | null) => {
    setColumnConfigs(prev => ({
      ...prev,
      [columnIndex]: {
        ...prev[columnIndex],
        codeframeFile: file || undefined
      }
    }));
  };

  const handleNetsSettingChange = (columnIndex: number, hasNets: boolean) => {
    updateColumnSetting(columnIndex, "hasNets", hasNets);
  };

  const handleMultiResponseChange = (columnIndex: number, isMulti: boolean) => {
    updateColumnSetting(columnIndex, "isMultiResponse", isMulti);
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
          <span>Enhanced Column Configuration</span>
          <Badge variant="outline" className="ml-2">
            {uploadedFile.filename}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure {textColumnCount} text response columns with advanced settings and question types.
        </CardDescription>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search columns..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="multi-select"
              checked={allowMultiSelection}
              onCheckedChange={setAllowMultiSelection}
            />
            <Label htmlFor="multi-select" className="text-sm">Multi-variable selection</Label>
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
            <span className="font-medium">Pro tip:</span> Configure each column with full question text and appropriate settings for better AI analysis.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          {filteredColumns.length > 0 ? (
            filteredColumns.map((column) => (
              <Card
                key={column.index}
                className={`${
                  column.type === 'text' ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100'
                } ${selectedColumns.includes(column.index) ? 'ring-1 ring-primary' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={`column-${column.index}`}
                      checked={selectedColumns.includes(column.index)}
                      onCheckedChange={() => toggleColumnSelection(column.index)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Label
                          htmlFor={`column-${column.index}`}
                          className="font-medium cursor-pointer"
                        >
                          {column.name || `Column ${column.index + 1}`}
                        </Label>
                        {column.type === 'text' && (
                          <Badge variant="secondary" className="text-xs">Text</Badge>
                        )}
                        {column.type === 'mixed' && (
                          <Badge variant="outline" className="text-xs">Mixed</Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Example: {column.examples.length > 0 ? column.examples[0] : 'No data'}
                      </div>
                      
                      {selectedColumns.includes(column.index) && (
                        <div className="space-y-3 pt-3 border-t border-gray-200">
                          {/* Question Type */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Question Type</Label>
                            <Select
                              value={columnQuestionTypes[column.index] || "miscellaneous"}
                              onValueChange={(value) => handleQuestionTypeChange(column.index, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="brand_awareness">Unaided Brand Awareness</SelectItem>
                                <SelectItem value="brand_description">Brand Description</SelectItem>
                                <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Full Question Text */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Full Question Text</Label>
                            <Textarea
                              placeholder="Enter the complete question text for better context..."
                              value={columnConfigs[column.index]?.fullQuestionText || ''}
                              onChange={(e) => handleQuestionTextChange(column.index, e.target.value)}
                              rows={2}
                            />
                          </div>
                          
                          {/* Existing Codeframe Toggle */}
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Has Existing Codeframe</Label>
                            <Switch
                              checked={columnConfigs[column.index]?.hasExistingCodeframe || false}
                              onCheckedChange={(checked) => handleExistingCodeframeToggle(column.index, checked)}
                            />
                          </div>
                          
                          {/* Codeframe File Upload */}
                          {columnConfigs[column.index]?.hasExistingCodeframe && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Upload Codeframe File</Label>
                              <Input
                                type="file"
                                accept=".xlsx,.csv,.txt"
                                onChange={(e) => handleCodeframeFileUpload(column.index, e.target.files?.[0] || null)}
                              />
                            </div>
                          )}
                          
                          {/* Settings Row */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Requires Nets</Label>
                              <Checkbox
                                checked={columnSettings[column.index]?.hasNets || false}
                                onCheckedChange={(checked) => handleNetsSettingChange(column.index, !!checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Multi-Response</Label>
                              <Checkbox
                                checked={columnSettings[column.index]?.isMultiResponse || false}
                                onCheckedChange={(checked) => handleMultiResponseChange(column.index, !!checked)}
                              />
                            </div>
                            
                            {allowMultiSelection && (
                              <div className="flex items-center justify-between">
                                <Label className="text-xs">Multi-Variable</Label>
                                <Checkbox disabled />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No columns match your search
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
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
          </div>
          
          {!activeCodeframe && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/upload-codeframe" className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                <span>Upload Codeframe</span>
              </Link>
            </Button>
          )}
        </div>
        
        <Button 
          onClick={startProcessing}
          disabled={selectedCount === 0} 
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          <span>Process Selected Columns with Enhanced Settings</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EnhancedColumnSelector;
