
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';
import ColumnSearchControls from './ColumnSearchControls';
import ColumnCard from './ColumnCard';
import ColumnSelectionSummary from './ColumnSelectionSummary';
import QuickStartAlert from './QuickStartAlert';
import ActiveCodeframeDisplay from './ActiveCodeframeDisplay';
import MultiVariableQuestionMatrix from './MultiVariableQuestionMatrix';
import SampleThresholdControl from './SampleThresholdControl';
import BrandListManager from './BrandListManager';

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
    activeCodeframe,
    columnQuestionConfigs,
    setColumnQuestionConfig
  } = useProcessing();
  
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);
  
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

  const handleQuestionConfigChange = (configs: Record<number, any>) => {
    // Update the processing context with the configs
    Object.entries(configs).forEach(([columnIndex, config]) => {
      setColumnQuestionConfig(Number(columnIndex), config);
    });
  };
  
  return (
    <div className="space-y-6">
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

      {/* Enhanced Configuration Section - Make it more prominent and always show when there are selected columns */}
      {selectedColumns.length > 0 && (
        <div className="space-y-6">
          {/* Multi-Variable Question Matrix - Always visible when columns selected */}
          <MultiVariableQuestionMatrix
            selectedColumns={selectedColumns}
            onConfigurationChange={handleQuestionConfigChange}
          />
          
          {/* Additional Advanced Controls */}
          <Card className="w-full">
            <CardHeader>
              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Advanced Controls & Settings
                    </div>
                    {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-6 mt-6">
                  {/* Sample & Brand Controls */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <SampleThresholdControl />
                    <BrandListManager />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedColumnSelector;
