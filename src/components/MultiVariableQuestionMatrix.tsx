
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Trash2, Upload, Grid } from 'lucide-react';
import { ColumnQuestionConfig } from '../types';

interface MultiVariableQuestionMatrixProps {
  columns: any[];
  selectedColumns: number[];
  onConfigUpdate: (columnIndex: number, config: ColumnQuestionConfig) => void;
}

const MultiVariableQuestionMatrix: React.FC<MultiVariableQuestionMatrixProps> = ({
  columns,
  selectedColumns,
  onConfigUpdate
}) => {
  const [questions, setQuestions] = useState<Record<number, ColumnQuestionConfig[]>>({});

  const addQuestion = (columnIndex: number) => {
    const newQuestion: ColumnQuestionConfig = {
      questionType: 'miscellaneous',
      fullQuestionText: '',
      hasExistingCodeframe: false
    };

    setQuestions(prev => ({
      ...prev,
      [columnIndex]: [...(prev[columnIndex] || []), newQuestion]
    }));
  };

  const removeQuestion = (columnIndex: number, questionIndex: number) => {
    setQuestions(prev => ({
      ...prev,
      [columnIndex]: prev[columnIndex]?.filter((_, i) => i !== questionIndex) || []
    }));
  };

  const updateQuestion = (columnIndex: number, questionIndex: number, updates: Partial<ColumnQuestionConfig>) => {
    setQuestions(prev => {
      const columnQuestions = [...(prev[columnIndex] || [])];
      columnQuestions[questionIndex] = {
        ...columnQuestions[questionIndex],
        ...updates
      };
      
      return {
        ...prev,
        [columnIndex]: columnQuestions
      };
    });

    // Update main config
    const updatedQuestion = {
      ...(questions[columnIndex]?.[questionIndex] || {}),
      ...updates
    };
    onConfigUpdate(columnIndex, updatedQuestion);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid className="h-5 w-5" />
          Multi-Variable Question Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedColumns.map(columnIndex => {
                const column = columns.find(col => col.index === columnIndex);
                const columnQuestions = questions[columnIndex] || [];
                
                return (
                  <TableRow key={columnIndex}>
                    <TableCell>
                      <div>
                        <Badge variant="outline">{column?.name || `Column ${columnIndex + 1}`}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {columnQuestions.map((question, questionIndex) => (
                          <div key={questionIndex} className="border rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Question {questionIndex + 1}</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(columnIndex, questionIndex)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Textarea
                              placeholder="Enter full question text..."
                              value={question.fullQuestionText}
                              onChange={(e) => updateQuestion(columnIndex, questionIndex, {
                                fullQuestionText: e.target.value
                              })}
                              className="text-xs"
                              rows={2}
                            />
                            
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Has Existing Codeframe</Label>
                              <Switch
                                checked={question.hasExistingCodeframe}
                                onCheckedChange={(checked) => updateQuestion(columnIndex, questionIndex, {
                                  hasExistingCodeframe: checked
                                })}
                              />
                            </div>
                            
                            {question.hasExistingCodeframe && (
                              <div className="space-y-2">
                                <Label className="text-xs">Upload Codeframe</Label>
                                <Input
                                  type="file"
                                  accept=".xlsx,.xls,.csv"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      updateQuestion(columnIndex, questionIndex, {
                                        codeframeFile: file
                                      });
                                    }
                                  }}
                                  className="text-xs"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addQuestion(columnIndex)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Question
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiVariableQuestionMatrix;
