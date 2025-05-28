import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Plus, Trash2, Upload, FileText, Copy, Settings2, Info } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';
import { ColumnQuestionConfig } from '../types';

interface QuestionRow {
  id: string;
  columnIndex: number;
  questionType: string;
  fullQuestionText: string;
  hasExistingCodeframe: boolean;
  codeframeFile?: File;
  isCustomRow?: boolean;
}

interface MultiVariableQuestionMatrixProps {
  selectedColumns: number[];
  onConfigurationChange: (configs: Record<number, ColumnQuestionConfig>) => void;
}

const QUESTION_TYPES = {
  "brand_awareness": "Unaided Brand Awareness",
  "brand_aided": "Aided Brand Awareness", 
  "brand_description": "Brand Description",
  "brand_perception": "Brand Perception",
  "satisfaction": "Satisfaction/Rating",
  "usage": "Usage/Behavior",
  "purchase_intent": "Purchase Intent",
  "demographics": "Demographics",
  "open_feedback": "Open Feedback",
  "nps": "Net Promoter Score",
  "advertising": "Advertising/Marketing",
  "competitive": "Competitive Analysis",
  "miscellaneous": "Miscellaneous"
};

const MultiVariableQuestionMatrix: React.FC<MultiVariableQuestionMatrixProps> = ({
  selectedColumns,
  onConfigurationChange
}) => {
  const { fileColumns, projectContext, columnQuestionConfigs } = useProcessing();
  const [questionRows, setQuestionRows] = useState<QuestionRow[]>([]);
  const [bulkQuestionType, setBulkQuestionType] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize question rows from selected columns
  useEffect(() => {
    const newRows = selectedColumns.map(colIndex => {
      const existing = questionRows.find(row => row.columnIndex === colIndex && !row.isCustomRow);
      const existingConfig = columnQuestionConfigs[colIndex];
      
      return existing || {
        id: `col-${colIndex}`,
        columnIndex: colIndex,
        questionType: existingConfig?.questionType || 'miscellaneous',
        fullQuestionText: existingConfig?.fullQuestionText || '',
        hasExistingCodeframe: existingConfig?.hasExistingCodeframe || false,
        codeframeFile: existingConfig?.codeframeFile,
        isCustomRow: false
      };
    });
    
    // Keep custom rows that don't conflict with column selections
    const customRows = questionRows.filter(row => 
      row.isCustomRow && !selectedColumns.includes(row.columnIndex)
    );
    
    setQuestionRows([...newRows, ...customRows]);
  }, [selectedColumns]);

  // Update parent when question rows change
  useEffect(() => {
    const configs: Record<number, ColumnQuestionConfig> = {};
    questionRows.forEach(row => {
      if (!row.isCustomRow) {
        configs[row.columnIndex] = {
          questionType: row.questionType,
          fullQuestionText: row.fullQuestionText,
          hasExistingCodeframe: row.hasExistingCodeframe,
          codeframeFile: row.codeframeFile
        };
      }
    });
    onConfigurationChange(configs);
  }, [questionRows, onConfigurationChange]);

  const updateQuestionRow = (rowId: string, updates: Partial<QuestionRow>) => {
    setQuestionRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, ...updates } : row
    ));
  };

  const handleFileUpload = (rowId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateQuestionRow(rowId, { codeframeFile: file });
    }
  };

  const getColumnName = (columnIndex: number): string => {
    const column = fileColumns.find(col => col.index === columnIndex);
    return column?.name || `Column ${columnIndex + 1}`;
  };

  const addCustomQuestionRow = () => {
    // Find the next available column index
    const usedColumns = questionRows.map(row => row.columnIndex);
    const availableColumns = selectedColumns.filter(col => !usedColumns.includes(col));
    
    if (availableColumns.length === 0) {
      // Create a custom row that doesn't map to a specific column
      const customIndex = Math.max(...selectedColumns, 0) + 1;
      const newRow: QuestionRow = {
        id: `custom-${Date.now()}`,
        columnIndex: customIndex,
        questionType: 'miscellaneous',
        fullQuestionText: '',
        hasExistingCodeframe: false,
        isCustomRow: true
      };
      setQuestionRows(prev => [...prev, newRow]);
    } else {
      // Use the first available column
      const newRow: QuestionRow = {
        id: `col-${availableColumns[0]}-${Date.now()}`,
        columnIndex: availableColumns[0],
        questionType: 'miscellaneous',
        fullQuestionText: '',
        hasExistingCodeframe: false,
        isCustomRow: false
      };
      setQuestionRows(prev => [...prev, newRow]);
    }
  };

  const removeQuestionRow = (rowId: string) => {
    setQuestionRows(prev => prev.filter(row => row.id !== rowId));
  };

  const duplicateQuestionRow = (rowId: string) => {
    const sourceRow = questionRows.find(row => row.id === rowId);
    if (sourceRow) {
      const newRow: QuestionRow = {
        ...sourceRow,
        id: `dup-${Date.now()}`,
        isCustomRow: true
      };
      setQuestionRows(prev => [...prev, newRow]);
    }
  };

  const bulkSetQuestionType = () => {
    if (!bulkQuestionType) return;
    
    setQuestionRows(prev => prev.map(row => ({ 
      ...row, 
      questionType: bulkQuestionType 
    })));
    setBulkQuestionType('');
  };

  const bulkToggleCodeframes = (enable: boolean) => {
    setQuestionRows(prev => prev.map(row => ({ 
      ...row, 
      hasExistingCodeframe: enable 
    })));
  };

  const clearAllQuestionText = () => {
    setQuestionRows(prev => prev.map(row => ({ 
      ...row, 
      fullQuestionText: '' 
    })));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Multi-Variable Question Configuration
          </span>
          <Badge variant="outline" className="text-xs">
            {questionRows.length} questions configured
          </Badge>
        </CardTitle>
        
        {projectContext && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Study Context:</strong> {projectContext.studyType} study for {projectContext.clientName} in {projectContext.industry}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Bulk Operations */}
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bulk Question Type Assignment</Label>
            <div className="flex gap-2">
              <Select value={bulkQuestionType} onValueChange={setBulkQuestionType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select question type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUESTION_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={bulkSetQuestionType} 
                disabled={!bulkQuestionType}
                size="sm"
              >
                Apply to All
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bulk Operations</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => bulkToggleCodeframes(true)}
              >
                Enable All Codeframes
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => bulkToggleCodeframes(false)}
              >
                Disable All Codeframes
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllQuestionText}
              >
                Clear All Text
              </Button>
            </div>
          </div>
        </div>

        {/* Question Matrix */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">Question Configuration Matrix</Label>
            <Button variant="outline" size="sm" onClick={addCustomQuestionRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question Row
            </Button>
          </div>
          
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
            <div className="col-span-2">Column/Question</div>
            <div className="col-span-2">Question Type</div>
            <div className="col-span-4">Full Question Text</div>
            <div className="col-span-2">Existing Codeframe</div>
            <div className="col-span-2">Actions</div>
          </div>
          
          {/* Question Rows */}
          {questionRows.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {questionRows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-2 items-start p-3 border rounded-lg hover:bg-gray-50">
                  <div className="col-span-2 pt-2">
                    <Badge 
                      variant={row.isCustomRow ? "secondary" : "outline"} 
                      className="text-xs"
                    >
                      {row.isCustomRow ? "Custom" : getColumnName(row.columnIndex)}
                    </Badge>
                  </div>
                  
                  <div className="col-span-2">
                    <Select
                      value={row.questionType}
                      onValueChange={(value) => updateQuestionRow(row.id, { questionType: value })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(QUESTION_TYPES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-4">
                    <Textarea
                      placeholder="Enter the full question text as shown to respondents..."
                      value={row.fullQuestionText}
                      onChange={(e) => updateQuestionRow(row.id, { fullQuestionText: e.target.value })}
                      className="min-h-[80px] text-sm resize-none"
                    />
                  </div>
                  
                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`existing-${row.id}`}
                        checked={row.hasExistingCodeframe}
                        onCheckedChange={(checked) => 
                          updateQuestionRow(row.id, { hasExistingCodeframe: !!checked })
                        }
                      />
                      <Label htmlFor={`existing-${row.id}`} className="text-xs">
                        Use existing
                      </Label>
                    </div>
                    
                    {row.hasExistingCodeframe && (
                      <div className="relative">
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => handleFileUpload(row.id, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                          <Upload className="h-3 w-3 mr-1" />
                          {row.codeframeFile ? 'Change File' : 'Upload'}
                        </Button>
                        {row.codeframeFile && (
                          <div className="text-xs text-green-600 mt-1 truncate" title={row.codeframeFile.name}>
                            ✓ {row.codeframeFile.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => duplicateQuestionRow(row.id)}
                      title="Duplicate row"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    
                    {(questionRows.length > 1 || row.isCustomRow) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeQuestionRow(row.id)}
                        title="Remove row"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Questions Configured</p>
              <p className="text-sm">Select columns from the main selector or add custom question rows.</p>
            </div>
          )}
        </div>

        {/* Configuration Summary */}
        {questionRows.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Configuration Summary</span>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-700">Questions by Type:</div>
                {Object.entries(
                  questionRows.reduce((acc, row) => {
                    const type = QUESTION_TYPES[row.questionType as keyof typeof QUESTION_TYPES];
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div key={type} className="text-xs text-blue-600">
                    {type}: {count}
                  </div>
                ))}
              </div>
              <div>
                <div className="font-medium text-blue-700">Codeframes:</div>
                <div className="text-xs text-blue-600">
                  With existing: {questionRows.filter(r => r.hasExistingCodeframe).length}
                </div>
                <div className="text-xs text-blue-600">
                  AI-generated: {questionRows.filter(r => !r.hasExistingCodeframe).length}
                </div>
              </div>
              <div>
                <div className="font-medium text-blue-700">Question Text:</div>
                <div className="text-xs text-blue-600">
                  Completed: {questionRows.filter(r => r.fullQuestionText.trim()).length}
                </div>
                <div className="text-xs text-blue-600">
                  Missing: {questionRows.filter(r => !r.fullQuestionText.trim()).length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiVariableQuestionMatrix;
