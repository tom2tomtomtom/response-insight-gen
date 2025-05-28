
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Upload, Plus, Trash2, Grid3X3 } from 'lucide-react';
import { ColumnQuestionConfig, ColumnInfo } from '../types';

interface MultiVariableQuestionMatrixProps {
  selectedColumns: number[];
  fileColumns: ColumnInfo[];
  onColumnConfigUpdate: (columnIndex: number, config: ColumnQuestionConfig) => void;
}

const MultiVariableQuestionMatrix: React.FC<MultiVariableQuestionMatrixProps> = ({
  selectedColumns,
  fileColumns,
  onColumnConfigUpdate
}) => {
  const [columnConfigs, setColumnConfigs] = useState<Record<number, ColumnQuestionConfig>>({});

  const updateColumnConfig = (columnIndex: number, updates: Partial<ColumnQuestionConfig>) => {
    const currentConfig = columnConfigs[columnIndex] || {
      questionType: 'miscellaneous',
      fullQuestionText: '',
      hasExistingCodeframe: false
    };
    
    const newConfig = { ...currentConfig, ...updates };
    setColumnConfigs(prev => ({
      ...prev,
      [columnIndex]: newConfig
    }));
    
    onColumnConfigUpdate(columnIndex, newConfig);
  };

  const handleFileUpload = (columnIndex: number, file: File) => {
    updateColumnConfig(columnIndex, { codeframeFile: file });
  };

  const getColumnConfig = (columnIndex: number): ColumnQuestionConfig => {
    return columnConfigs[columnIndex] || {
      questionType: 'miscellaneous',
      fullQuestionText: '',
      hasExistingCodeframe: false
    };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />
          Multi-Variable Question Matrix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedColumns.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Select columns in the previous step to configure question settings
          </p>
        ) : (
          selectedColumns.map((columnIndex) => {
            const column = fileColumns.find(col => col.index === columnIndex);
            const config = getColumnConfig(columnIndex);
            
            if (!column) return null;
            
            return (
              <div key={columnIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{column.name}</h3>
                  <Badge variant="outline">Column {columnIndex + 1}</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Question Type</Label>
                    <Select
                      value={config.questionType}
                      onValueChange={(value) => updateColumnConfig(columnIndex, { questionType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                        <SelectItem value="brand_description">Brand Description</SelectItem>
                        <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Has Existing Codeframe</Label>
                    <Switch
                      checked={config.hasExistingCodeframe}
                      onCheckedChange={(checked) => updateColumnConfig(columnIndex, { hasExistingCodeframe: checked })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Full Question Text</Label>
                  <Textarea
                    placeholder="Enter the complete question text as it appears in the survey..."
                    value={config.fullQuestionText}
                    onChange={(e) => updateColumnConfig(columnIndex, { fullQuestionText: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>
                
                {config.hasExistingCodeframe && (
                  <div className="space-y-2">
                    <Label>Upload Existing Codeframe</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(columnIndex, file);
                        }}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    {config.codeframeFile && (
                      <p className="text-sm text-muted-foreground">
                        Uploaded: {config.codeframeFile.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default MultiVariableQuestionMatrix;
