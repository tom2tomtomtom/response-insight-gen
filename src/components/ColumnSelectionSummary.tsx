
import React from 'react';
import { CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowRight, FileText, FileCode, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UploadedCodeframe } from '../types';
import { useProcessing } from '../contexts/ProcessingContext';
import { Alert, AlertDescription } from './ui/alert';

interface ColumnSelectionSummaryProps {
  selectedCount: number;
  activeCodeframe: UploadedCodeframe | null;
  onContinueToAnalysis: () => void;
}

const ColumnSelectionSummary: React.FC<ColumnSelectionSummaryProps> = ({
  selectedCount,
  activeCodeframe,
  onContinueToAnalysis
}) => {
  const { columnQuestionTypes, fileColumns, selectedColumns } = useProcessing();
  
  // Calculate how many codeframes will be generated
  const getCodeframeCount = () => {
    if (activeCodeframe) return 1; // Using existing codeframe
    
    const questionTypes = new Set<string>();
    selectedColumns.forEach(colIndex => {
      const questionType = columnQuestionTypes[colIndex] || 'miscellaneous';
      questionTypes.add(questionType);
    });
    
    return questionTypes.size;
  };
  
  const codeframeCount = getCodeframeCount();
  
  // Get question type breakdown
  const getQuestionTypeBreakdown = () => {
    const breakdown: Record<string, number> = {};
    
    selectedColumns.forEach(colIndex => {
      const questionType = columnQuestionTypes[colIndex] || 'miscellaneous';
      breakdown[questionType] = (breakdown[questionType] || 0) + 1;
    });
    
    return breakdown;
  };
  
  const questionTypeBreakdown = getQuestionTypeBreakdown();
  return (
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
      
      {/* Codeframe count preview */}
      {selectedCount > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {activeCodeframe ? (
              <span>Using existing codeframe: <strong>{activeCodeframe.name}</strong></span>
            ) : (
              <div className="space-y-2">
                <p>Will generate <strong>{codeframeCount} codeframe{codeframeCount !== 1 ? 's' : ''}</strong>:</p>
                <ul className="list-disc list-inside text-sm ml-2">
                  {Object.entries(questionTypeBreakdown).map(([type, count]) => (
                    <li key={type}>
                      {type === 'brand_awareness' && 'Brand Awareness'}
                      {type === 'brand_description' && 'Brand Description'}
                      {type === 'miscellaneous' && 'Miscellaneous'}
                      {' '}({count} column{count !== 1 ? 's' : ''})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={onContinueToAnalysis}
        disabled={selectedCount === 0} 
        className="w-full"
      >
        <ArrowRight className="h-4 w-4 mr-2" />
        <span>Continue to Analysis</span>
      </Button>
    </CardFooter>
  );
};

export default ColumnSelectionSummary;
