import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Search, ArrowRight, FileText, FileCode, Tag, CheckSquare, Lightbulb, Upload } from 'lucide-react';
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

interface EnhancedColumnSelectorProps {
  onContinueToAnalysis: () => void;
}

const EnhancedColumnSelector: React.FC<EnhancedColumnSelectorProps> = ({ onContinueToAnalysis }) => {
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
          <span>Column Selection</span>
          <Badge variant="outline" className="ml-2">
            {uploadedFile.filename}
          </Badge>
        </CardTitle>
        <CardDescription>
          Select the {textColumnCount} text columns you want to analyze for open-ended responses.
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
        
        {/* Simplified Instructions */}
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Lightbulb className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            <span className="font-medium">Quick start:</span> Simply select the columns containing open-ended text responses. Advanced settings are available in the next step.
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
                    <div className="flex-1 space-y-2">
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
          onClick={onContinueToAnalysis}
          disabled={selectedCount === 0} 
          className="w-full"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          <span>Continue to Analysis</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EnhancedColumnSelector;
