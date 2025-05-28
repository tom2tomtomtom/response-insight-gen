
import React from 'react';
import { CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowRight, FileText, FileCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CodeframeData } from '../types';

interface ColumnSelectionSummaryProps {
  selectedCount: number;
  activeCodeframe: CodeframeData | null;
  onContinueToAnalysis: () => void;
}

const ColumnSelectionSummary: React.FC<ColumnSelectionSummaryProps> = ({
  selectedCount,
  activeCodeframe,
  onContinueToAnalysis
}) => {
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
