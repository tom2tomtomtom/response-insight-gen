
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { FileSpreadsheet, BarChart3 } from 'lucide-react';
import { ProcessedResult } from '../types';

interface StudyOutputFormatProps {
  results: ProcessedResult;
  studyId?: string;
}

const StudyOutputFormat: React.FC<StudyOutputFormatProps> = ({ results, studyId = "20250128" }) => {
  // Calculate summary statistics similar to the reference image
  const calculateSummaryStats = () => {
    const stats = results.codedResponses.map(response => {
      const column = response.columnName || "Unknown";
      const questionText = response.columnName || "Question text not available";
      const respondentsCoded = 1; // Each response represents one respondent
      const avgCodesApplied = response.codesAssigned.length;
      const totalCodesApplied = response.codesAssigned.length;
      const maxCodesSetting = 99; // Default max codes setting
      
      return {
        study: studyId,
        question: column,
        questionText,
        respondentsCoded,
        avgCodesApplied,
        totalCodesApplied,
        maxCodesSetting
      };
    });
    
    // Group by question/column and aggregate
    const grouped = stats.reduce((acc, stat) => {
      const key = stat.question;
      if (!acc[key]) {
        acc[key] = {
          study: stat.study,
          question: stat.question,
          questionText: stat.questionText,
          respondentsCoded: 0,
          totalCodesApplied: 0,
          maxCodesSetting: stat.maxCodesSetting
        };
      }
      
      acc[key].respondentsCoded += stat.respondentsCoded;
      acc[key].totalCodesApplied += stat.totalCodesApplied;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert back to array and calculate averages
    return Object.values(grouped).map((group: any) => ({
      ...group,
      avgCodesApplied: Number((group.totalCodesApplied / group.respondentsCoded).toFixed(1))
    }));
  };

  const summaryStats = calculateSummaryStats();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Study Output Format
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summaryStats.length}</div>
            <div className="text-sm text-muted-foreground">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {summaryStats.reduce((sum, stat) => sum + stat.respondentsCoded, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Responses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{results.codeframe.length}</div>
            <div className="text-sm text-muted-foreground">Total Codes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {(summaryStats.reduce((sum, stat) => sum + stat.avgCodesApplied, 0) / summaryStats.length || 0).toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Codes/Response</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <h3 className="font-medium">Question Summary</h3>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Study</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Question Text</TableHead>
                  <TableHead className="text-center">Respondents Coded</TableHead>
                  <TableHead className="text-center">Average Codes Applied</TableHead>
                  <TableHead className="text-center">Total Codes Applied</TableHead>
                  <TableHead className="text-center">Max Codes Setting</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryStats.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell>{stat.study}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{stat.question}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate" title={stat.questionText}>
                        {stat.questionText}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{stat.respondentsCoded}</TableCell>
                    <TableCell className="text-center">{stat.avgCodesApplied}</TableCell>
                    <TableCell className="text-center">{stat.totalCodesApplied}</TableCell>
                    <TableCell className="text-center">{stat.maxCodesSetting}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>Ranked:</span>
                      <Badge>Total in descending order</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {summaryStats.reduce((sum, stat) => sum + stat.respondentsCoded, 0)}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {(summaryStats.reduce((sum, stat) => sum + stat.avgCodesApplied, 0) / summaryStats.length || 0).toFixed(1)}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {summaryStats.reduce((sum, stat) => sum + stat.totalCodesApplied, 0)}
                  </TableCell>
                  <TableCell className="text-center">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 p-3 rounded">
            <span>Applied Max Code Setting Override For This Report:</span>
            <Badge variant="secondary">no limit</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyOutputFormat;
