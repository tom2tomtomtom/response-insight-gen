
import React from 'react';
import { MessageSquare } from 'lucide-react';

interface InsightsPanelProps {
  insights: string;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  // Function to clean markdown syntax from text
  const cleanMarkdown = (text: string) => {
    return text
      .replace(/#+\s?/g, '') // Remove heading markers (# ## ###)
      .replace(/\*\*/g, '')   // Remove bold markers (**)
      .replace(/\*/g, '')     // Remove italic markers (*)
      .replace(/_{1,2}/g, ''); // Remove underscore markers (_ or __)
  };

  const cleanedInsights = cleanMarkdown(insights);

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-md dark:bg-blue-950 dark:border-blue-900">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-blue-500" />
        <h3 className="font-medium">Key Insights</h3>
      </div>
      <div className="text-sm prose max-w-none dark:prose-invert text-left">
        <pre className="whitespace-pre-wrap text-sm font-sans text-left">{cleanedInsights}</pre>
      </div>
    </div>
  );
};

export default InsightsPanel;
