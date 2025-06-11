import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CleanLayout from '../components/CleanLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { ArrowLeft, ArrowRight, FileText, CheckCircle, Users, Search } from 'lucide-react';
import { toast } from '../components/ui/use-toast';

interface ColumnInfo {
  index: number;
  name: string;
  type: 'text' | 'numeric' | 'mixed' | 'empty';
  examples: string[];
  nonEmptyCount: number;
  totalCount: number;
}

const ProjectColumns: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);
  const [respondentIdColumn, setRespondentIdColumn] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const loadFileData = async () => {
      if (!projectId) return;

      try {
        const { default: apiClient } = await import('../services/apiClient');
        const result = await apiClient.getFileMetadata(projectId);
        
        if (result.success && result.data) {
          const { columns } = result.data;
          setColumns(columns || []);
          
          // Auto-select text columns with meaningful content
          const textColumns = (columns || [])
            .filter((col: ColumnInfo) => {
              const columnName = col.name.toLowerCase();
              const isTextType = col.type === 'text';
              const hasContent = col.nonEmptyCount > 0;
              
              // Filter out likely non-text columns (IDs, metadata, etc.)
              const isMetadataColumn = 
                columnName.includes('id') ||
                columnName.includes('respondent') ||
                columnName.includes('timestamp') ||
                columnName.includes('date') ||
                columnName.includes('time') ||
                columnName.includes('created') ||
                columnName.includes('modified') ||
                columnName.includes('status') ||
                columnName.includes('uuid') ||
                columnName.includes('ref') ||
                columnName.startsWith('q') && columnName.length <= 3; // Skip Q1, Q2, etc. unless they have descriptive text
              
              console.log(`Column "${col.name}": type=${col.type}, nonEmpty=${col.nonEmptyCount}, isMetadata=${isMetadataColumn}`);
              
              return isTextType && hasContent && !isMetadataColumn;
            })
            .map((col: ColumnInfo) => col.index);
          
          console.log('Auto-selected text columns:', textColumns);
          setSelectedColumns(textColumns);

          // Try to auto-detect respondent ID column
          const idColumn = (columns || []).find((col: ColumnInfo) => 
            col.name.toLowerCase().includes('id') || 
            col.name.toLowerCase().includes('respondent') ||
            col.name.toLowerCase().includes('response_id') ||
            col.name.toLowerCase().includes('participant')
          );
          if (idColumn) {
            setRespondentIdColumn(idColumn.index);
          }
        }
      } catch (error) {
        console.error('Error loading file data:', error);
        toast({
          variant: "destructive",
          title: "Error loading file data",
          description: "Please try uploading the file again.",
        });
      }
    };

    loadFileData();
  }, [projectId]);

  const handleColumnToggle = (columnIndex: number) => {
    setSelectedColumns(prev => 
      prev.includes(columnIndex) 
        ? prev.filter(idx => idx !== columnIndex)
        : [...prev, columnIndex]
    );
  };

  const handleSelectAll = () => {
    const textColumns = columns
      .filter(col => col.type === 'text')
      .map(col => col.index);
    setSelectedColumns(textColumns);
  };

  const handleDeselectAll = () => {
    setSelectedColumns([]);
  };

  const handleNext = () => {
    if (!respondentIdColumn) {
      toast({
        variant: "destructive",
        title: "Respondent ID required",
        description: "Please select a respondent ID column to continue.",
      });
      return;
    }

    if (selectedColumns.length === 0) {
      toast({
        variant: "destructive",
        title: "No columns selected",
        description: "Please select at least one column to analyze.",
      });
      return;
    }

    // Save column selection
    const selectionData = {
      selectedColumns,
      respondentIdColumn,
      selectedAt: new Date()
    };

    localStorage.setItem(`qualicoding-project-${projectId}-columns`, JSON.stringify(selectionData));

    toast({
      title: "Columns selected",
      description: `${selectedColumns.length} columns ready for grouping.`,
    });

    navigate(`/project/${projectId}/grouping`);
  };

  // Filter columns based on search term
  const filteredColumns = columns.filter(col => 
    col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.examples.some(example => 
      example.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const textColumns = filteredColumns.filter(col => col.type === 'text');
  const nonTextColumns = filteredColumns.filter(col => col.type !== 'text');

  return (
    <CleanLayout title="Select Columns" subtitle="Step 3 of 4: Column Selection">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(`/project/${projectId}/upload`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
        </div>

        <div className="space-y-6">
          {/* Respondent ID Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Respondent ID Column
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Select the column that contains unique respondent identifiers.
              </p>
              {/* Search for respondent ID columns */}
              <div className="mb-4">
                <Input
                  placeholder="Search columns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredColumns.map((column) => (
                  <div key={`id-${column.index}`} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                    <Checkbox
                      id={`respondent-${column.index}`}
                      checked={respondentIdColumn === column.index}
                      onCheckedChange={() => setRespondentIdColumn(
                        respondentIdColumn === column.index ? null : column.index
                      )}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`respondent-${column.index}`}
                        className="font-medium text-slate-900 cursor-pointer"
                      >
                        {column.name}
                      </label>
                      <div className="text-sm text-slate-600">
                        {column.nonEmptyCount} values • Type: {column.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Text Columns for Analysis */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Text Columns for Analysis
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Select the text columns you want to analyze. Text columns with meaningful content are automatically selected.
              </p>
              
              {/* Search for text columns */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search columns by name or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              {textColumns.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No text columns were detected in your file. Please check your data or upload a different file.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {searchTerm && (
                    <div className="mb-3 text-sm text-slate-600">
                      Showing {textColumns.length} of {columns.filter(col => col.type === 'text').length} text columns
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3">
                    {textColumns.map((column) => (
                    <div key={column.index} className={`p-4 border rounded-lg transition-colors ${
                      selectedColumns.includes(column.index) 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`column-${column.index}`}
                          checked={selectedColumns.includes(column.index)}
                          onCheckedChange={() => handleColumnToggle(column.index)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <label
                              htmlFor={`column-${column.index}`}
                              className="font-medium text-slate-900 cursor-pointer"
                            >
                              {column.name}
                            </label>
                            <Badge variant="secondary">
                              {column.nonEmptyCount} responses
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600 mb-2">
                            <strong>Examples:</strong> {column.examples.slice(0, 2).join(' • ')}
                            {column.examples.length > 2 && '...'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {Math.round((column.nonEmptyCount / column.totalCount) * 100)}% completion rate
                          </div>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Non-text columns info */}
          {nonTextColumns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-slate-600">Other Columns (Not Available for Coding)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600 mb-3">
                  These columns contain numeric or empty data and cannot be used for qualitative coding:
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {nonTextColumns.map((column) => (
                    <div key={column.index} className="text-sm text-slate-500 p-2 bg-slate-50 rounded">
                      {column.name} ({column.type})
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {selectedColumns.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Ready to analyze {selectedColumns.length} columns with {' '}
                {textColumns
                  .filter(col => selectedColumns.includes(col.index))
                  .reduce((sum, col) => sum + col.nonEmptyCount, 0)
                } total responses.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleNext} 
              disabled={!respondentIdColumn || selectedColumns.length === 0}
            >
              Next: Group Questions
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </CleanLayout>
  );
};

export default ProjectColumns;