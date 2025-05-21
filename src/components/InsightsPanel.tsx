
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MessageSquare } from 'lucide-react';
import { Badge } from './ui/badge';

interface InsightsPanelProps {
  insights: string;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  if (!insights) return null;
  
  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          <span>Analysis Insights</span>
          <Badge variant="outline" className="ml-auto">AI Generated</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap text-sm font-sans">{insights}</pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsPanel;
