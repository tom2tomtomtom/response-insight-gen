
import React from 'react';
import { CodeSummary } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { BarChart } from 'lucide-react';

interface CodeSummaryProps {
  codeSummary: CodeSummary[];
}

const CodeSummaryChart: React.FC<CodeSummaryProps> = ({ codeSummary }) => {
  // Sort by percentage descending
  const sortedCodes = [...codeSummary].sort((a, b) => b.percentage - a.percentage);
  
  return (
    <Card className="w-full mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-md font-medium">Code Distribution</CardTitle>
        <BarChart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedCodes.map(code => (
            <div key={code.code} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span className="font-medium">{code.numeric}</span>
                  <span className="ml-2 text-muted-foreground">{code.label}</span>
                </div>
                <span className="font-medium">{code.percentage.toFixed(1)}%</span>
              </div>
              <Progress value={code.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeSummaryChart;
