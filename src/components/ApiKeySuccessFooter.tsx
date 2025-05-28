
import React from 'react';
import { CardFooter } from './ui/card';
import { CheckCircle2 } from 'lucide-react';

interface ApiKeySuccessFooterProps {
  isConfigured: boolean;
}

const ApiKeySuccessFooter: React.FC<ApiKeySuccessFooterProps> = ({ isConfigured }) => {
  if (!isConfigured) return null;

  return (
    <CardFooter className="bg-green-50 dark:bg-green-950 flex gap-2 items-center">
      <CheckCircle2 className="text-green-600 h-5 w-5" />
      <span className="text-sm text-green-600">API key configured successfully - you can now analyze your data</span>
    </CardFooter>
  );
};

export default ApiKeySuccessFooter;
