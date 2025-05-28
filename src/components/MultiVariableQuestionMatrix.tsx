
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Trash2, Upload } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';
import { ColumnQuestionConfig } from '../types';

interface QuestionRow {
  id: string;
  columnIndex: number;
  questionType: string;
  fullQuestionText: string;
  hasExistingCodeframe: boolean;
  codeframeFile?: File;
}

interface MultiVariableQuestionMatrixProps {
  selectedColumns: number[];
  onConfigurationChange: (configs: Record<number, ColumnQuestionConfig>) => void;
}

const QUESTION_TYPES = {
  "brand_awareness": "Unaided Brand Awareness",
  "brand_description": "Brand Description",
  "miscellaneous": "Miscellaneous"
};

const MultiVariableQuestionMatrix: React.FC<MultiVariableQuestionMatrixProps> = ({
  selectedColumns,
  onConfigurationChange
}) => {
  const { fileColumns } = useProcessing();
  const [questionRows, setQuestionRows] = useState<QuestionRow[]>(
    selectedColumns.map(colIndex => ({
      id: `row-${colIndex}`,
      columnIndex: colIndex,
      questionType: 'miscellaneous',
      fullQuestionText: '',
      hasExistingCodeframe: false
    }))
  );

  const updateQuestionRow = (rowId: string, updates: Partial<QuestionRow>) => {
    setQuestionRows(prev => {
      const updated = prev.map(row => 
        row.id === rowId ? { ...row, ...updates } : row
      );
      
      // Convert to configuration format and notify parent
      const configs: Record<number, ColumnQuestionConfig> = {};
      updated.forEach(row => {
        configs[row.columnIndex] = {
          questionType: row.questionType,
          fullQuestionText: row.fullQuestionText,
          hasExistingCodeframe: row.hasExistingCodeframe,
          codeframeFile: row.codeframeFile
        };
      });
      onConfigurationChange(configs);
      
      return updated;
    });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Configuration Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
            <div className="col-span-3">Column</div>
            <div className="col-span-2">Question Type</div>
            <div className="col-span-4">Full Question Text</div>
            <div className="col-span-2">Existing Codeframe</div>
            <div className="col-span-1">File</div>
          </div>
          
          {questionRows.map((row) => (
            <div key={row.id} className="grid grid-cols-12 gap-2 items-start p-2 border rounded">
              <div className="col-span-3 pt-2">
                <Badge variant="outline" className="text-xs">
                  {getColumnName(row.columnIndex)}
                </Badge>
              </div>
              
              <div className="col-span-2">
                <Select
                  value={row.questionType}
                  onValueChange={(value) => updateQuestionRow(row.id, { questionType: value })}
                >
                  <SelectTrigger className="h-8">
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
                  placeholder="Enter the full question text..."
                  value={row.fullQuestionText}
                  onChange={(e) => updateQuestionRow(row.id, { fullQuestionText: e.target.value })}
                  className="min-h-[60px] text-sm"
                />
              </div>
              
              <div className="col-span-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`existing-${row.id}`}
                    checked={row.hasExistingCodeframe}
                    onCheckedChange={(checked) => 
                      updateQuestionRow(row.id, { hasExistingCodeframe: !!checked })
                    }
                  />
                  <Label htmlFor={`existing-${row.id}`} className="text-xs">
                    Has existing
                  </Label>
                </div>
              </div>
              
              <div className="col-span-1">
                {row.hasExistingCodeframe && (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => handleFileUpload(row.id, e)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <Upload className="h-3 w-3" />
                    </Button>
                    {row.codeframeFile && (
                      <div className="text-xs text-green-600 mt-1 truncate">
                        {row.codeframeFile.name}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiVariableQuestionMatrix;
