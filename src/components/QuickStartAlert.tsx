
import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Lightbulb } from 'lucide-react';

const QuickStartAlert: React.FC = () => {
  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <Lightbulb className="h-4 w-4 text-blue-500" />
      <AlertDescription className="text-sm">
        <span className="font-medium">Quick start:</span> Simply select the columns containing open-ended text responses. Advanced settings are available in the next step.
      </AlertDescription>
    </Alert>
  );
};

export default QuickStartAlert;
