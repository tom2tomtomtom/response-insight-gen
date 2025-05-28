
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { useProcessing } from '../contexts/ProcessingContext';
import ColumnSearchControls from './ColumnSearchControls';
import ColumnCard from './ColumnCard';
import ColumnSelectionSummary from './ColumnSelectionSummary';
import QuickStartAlert from './QuickStartAlert';
import ActiveCodeframeDisplay from './ActiveCodeframeDisplay';

interface EnhancedColumnSelectorProps {
  onContinueToAnalysis: () => void;
}

const EnhancedColumnSelector: React.FC<EnhancedColumnSelectorProps> = ({ onContinueToAnalysis }) => {
  const { 
    fileColumns, 
    selectedColumns, 
    toggleColumnSelection,
    selectMultipleColumns,
    uploadedFile, 
    searchQuery,
    setSearchQuery,
    activeCodeframe
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
        
        <ColumnSearchControls
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          filteredColumns={filteredColumns}
          selectedColumns={selectedColumns}
          onSelectAllFiltered={handleSelectAllFiltered}
        />
      </CardHeader>
      
      <CardContent>
        {activeCodeframe && (
          <ActiveCodeframeDisplay activeCodeframe={activeCodeframe} />
        )}
        
        <QuickStartAlert />
        
        <div className="space-y-4">
          {filteredColumns.length > 0 ? (
            filteredColumns.map((column) => (
              <ColumnCard
                key={column.index}
                column={column}
                isSelected={selectedColumns.includes(column.index)}
                onToggle={toggleColumnSelection}
              />
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No columns match your search
            </div>
          )}
        </div>
      </CardContent>
      
      <ColumnSelectionSummary
        selectedCount={selectedCount}
        activeCodeframe={activeCodeframe}
        onContinueToAnalysis={onContinueToAnalysis}
      />
    </Card>
  );
};

export default EnhancedColumnSelector;
