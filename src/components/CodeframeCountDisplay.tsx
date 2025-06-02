import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Info, Layers } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';

const CodeframeCountDisplay: React.FC = () => {
  const { selectedColumns, columnQuestionTypes } = useProcessing();
  
  // Calculate how many codeframes will be generated
  const codeframeGroups = React.useMemo(() => {
    if (selectedColumns.length === 0) return {};
    
    const groups: Record<string, number> = {};
    
    selectedColumns.forEach(colIndex => {
      const questionType = columnQuestionTypes[colIndex] || 'miscellaneous';
      groups[questionType] = (groups[questionType] || 0) + 1;
    });
    
    return groups;
  }, [selectedColumns, columnQuestionTypes]);
  
  const totalCodeframes = Object.keys(codeframeGroups).length;
  
  if (selectedColumns.length === 0 || totalCodeframes === 0) {
    return null;
  }
  
  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'brand_awareness': return 'Brand Awareness';
      case 'brand_description': return 'Brand Description';
      case 'miscellaneous': return 'Miscellaneous';
      default: return type;
    }
  };
  
  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Layers className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-900">
        <div className="font-medium mb-2">
          {totalCodeframes} codeframe{totalCodeframes > 1 ? 's' : ''} will be generated
        </div>
        <div className="space-y-1 text-sm">
          {Object.entries(codeframeGroups).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-blue-700">{getQuestionTypeLabel(type)}:</span>
              <span className="font-medium text-blue-900">
                {count} column{count > 1 ? 's' : ''} grouped
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
          <Info className="h-3 w-3" />
          <span>Questions of the same type share a single codeframe</span>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default CodeframeCountDisplay;