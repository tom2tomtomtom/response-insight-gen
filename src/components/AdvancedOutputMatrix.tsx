
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Download, Database, BarChart3 } from 'lucide-react';
import { Badge } from './ui/badge';
import { CodeframeEntry, CodedResponse } from '../types';

interface AdvancedOutputMatrixProps {
  codeframe: CodeframeEntry[];
  codedResponses: CodedResponse[];
  onDownloadMatrix: () => void;
}

const AdvancedOutputMatrix: React.FC<AdvancedOutputMatrixProps> = ({
  codeframe,
  codedResponses,
  onDownloadMatrix
}) => {
  // Create the advanced matrix structure based on your example
  const createAdvancedMatrix = () => {
    const baseColumns = [
      { name: "record", type: "int64" },
      { name: "uuid", type: "object" }
    ];

    // Add original response columns
    const responseColumns = codedResponses.map((_, index) => ({
      name: `B1r${index + 1}`,
      type: "object"
    }));

    // Add individual code columns
    const codeColumns = codeframe.flatMap((code, codeIndex) => [
      { name: `B1r1_CODE_${codeIndex + 1}`, type: "float64" }
    ]);

    // Add NET columns (grouped themes)
    const netColumns = [
      { name: "B1r1_Positive/Neutral GRAND NET", type: "float64" },
      { name: "B1r1_  A Must/On The Bucket List NET", type: "float64" },
      { name: "B1r1_  Popular NET", type: "float64" },
      { name: "B1r1_  Easy/Simple NET", type: "float64" },
      { name: "B1r1_  Less Busy/Crowded NET", type: "float64" },
      { name: "B1r1_  Lively/Fast Paced NET", type: "float64" },
      { name: "B1r1_  Different/Unique NET", type: "float64" },
      { name: "B1r1_  Good People NET", type: "float64" },
      { name: "B1r1_  Traditional  NET", type: "float64" },
      { name: "B1r1_  Home/Family (Positive/Neutral) NET", type: "float64" },
      { name: "B1r1_  Positive/Neutral Vibes/Atmosphere NET", type: "float64" },
      { name: "B1r1_  Beautiful/Scenic NET", type: "float64" },
      { name: "B1r1_  Relaxing/Peaceful/Quiet NET", type: "float64" },
      { name: "B1r1_  Positive/Neutral Seasons/Weather NET", type: "float64" }
    ];

    return {
      columns: [...baseColumns, ...responseColumns, ...codeColumns, ...netColumns]
    };
  };

  const matrixStructure = createAdvancedMatrix();
  const previewColumns = matrixStructure.columns.slice(0, 15);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Advanced Output Matrix Structure
          </div>
          <Button onClick={onDownloadMatrix} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Matrix
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{matrixStructure.columns.length}</div>
              <div className="text-sm text-muted-foreground">Total Columns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{codeframe.length}</div>
              <div className="text-sm text-muted-foreground">Code Columns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">14</div>
              <div className="text-sm text-muted-foreground">NET Columns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{codedResponses.length}</div>
              <div className="text-sm text-muted-foreground">Response Rows</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <h3 className="font-medium">Column Structure Preview</h3>
              <Badge variant="outline">Showing first 15 of {matrixStructure.columns.length} columns</Badge>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column Name</TableHead>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewColumns.map((column, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{column.name}</TableCell>
                      <TableCell>
                        <Badge variant={column.type === 'float64' ? 'default' : 'secondary'}>
                          {column.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {column.name.includes('CODE_') ? 'Individual Code' :
                           column.name.includes('NET') ? 'Grouped NET' :
                           column.name.includes('B1r') ? 'Response Text' :
                           'System'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {matrixStructure.columns.length > 15 && (
              <p className="text-center text-sm text-muted-foreground">
                ... and {matrixStructure.columns.length - 15} more columns including NET groupings and subnets
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedOutputMatrix;
