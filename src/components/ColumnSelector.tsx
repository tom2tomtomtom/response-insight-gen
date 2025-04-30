
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Play, FileText } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';

const ColumnSelector: React.FC = () => {
  const { 
    fileColumns, 
    selectedColumns, 
    toggleColumnSelection, 
    startProcessing, 
    uploadedFile, 
    searchQuery,
    setSearchQuery
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
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
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
          Select which columns to analyze.
        </CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search columns..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredColumns.length > 0 ? (
              filteredColumns.map((column) => (
                <div
                  key={column.index}
                  className={`flex items-start space-x-2 border rounded-md p-3 ${
                    column.type === 'text' ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100'
                  } ${selectedColumns.includes(column.index) ? 'ring-1 ring-primary' : ''}`}
                >
                  <Checkbox
                    id={`column-${column.index}`}
                    checked={selectedColumns.includes(column.index)}
                    onCheckedChange={() => toggleColumnSelection(column.index)}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`column-${column.index}`}
                        className="font-medium cursor-pointer"
                      >
                        {column.name || `Column ${column.index + 1}`}
                      </Label>
                      {column.type === 'text' && (
                        <Badge variant="secondary" className="text-xs">
                          Text
                        </Badge>
                      )}
                      {column.type === 'mixed' && (
                        <Badge variant="outline" className="text-xs">
                          Mixed
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
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
              ))
            ) : (
              <div className="col-span-2 p-6 text-center text-muted-foreground">
                No columns match your search
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t p-4">
        <div className="text-sm text-muted-foreground flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          <span>{selectedCount} column{selectedCount !== 1 ? 's' : ''} selected</span>
        </div>
        <Button 
          onClick={startProcessing}
          disabled={selectedCount === 0} 
          className="space-x-2"
        >
          <Play className="h-4 w-4" />
          <span>Process Selected Columns</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ColumnSelector;
