
import React from 'react';
import { Badge } from './ui/badge';
import { FileCode } from 'lucide-react';
import { UploadedCodeframe } from '../types';

interface ActiveCodeframeDisplayProps {
  activeCodeframe: UploadedCodeframe;
}

const ActiveCodeframeDisplay: React.FC<ActiveCodeframeDisplayProps> = ({ activeCodeframe }) => {
  return (
    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
      <div className="flex items-center gap-2">
        <FileCode className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium text-ellipsis overflow-hidden whitespace-nowrap">
          Using uploaded codeframe: {activeCodeframe.name}
        </span>
        <Badge variant="outline" className="ml-auto shrink-0">
          {activeCodeframe.entries.length} codes
        </Badge>
      </div>
    </div>
  );
};

export default ActiveCodeframeDisplay;
