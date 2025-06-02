import React from 'react';
import { Button } from './ui/button';
import { Edit } from 'lucide-react';
import CodeframeEditor from './CodeframeEditor';
import { CodeframeEntry } from '../types';

interface CodeframeRefinementProps {
  codeframe: CodeframeEntry[];
  onRefine: (refinedCodeframe: CodeframeEntry[], action: string) => void;
  isRefinementMode: boolean;
  onToggleRefinement: () => void;
}

const CodeframeRefinement: React.FC<CodeframeRefinementProps> = ({
  codeframe,
  onRefine,
  isRefinementMode,
  onToggleRefinement
}) => {
  
  const handleCodeframeChange = (newCodeframe: CodeframeEntry[]) => {
    // Track the changes for AI reprocessing
    const action = 'Manual codeframe edit';
    onRefine(newCodeframe, action);
  };

  if (!isRefinementMode) {
    return (
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={onToggleRefinement}>
          <Edit className="h-4 w-4 mr-2" />
          Refine Codeframe
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CodeframeEditor
        codeframe={codeframe}
        onCodeframeChange={handleCodeframeChange}
        isEditable={isRefinementMode}
      />
      <div className="flex justify-end">
        <Button onClick={onToggleRefinement}>
          Done Editing
        </Button>
      </div>
    </div>
  );
};

export default CodeframeRefinement;