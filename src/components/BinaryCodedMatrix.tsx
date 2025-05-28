
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Download, Grid } from 'lucide-react';
import { CodeframeEntry, CodedResponse } from '../types';

interface BinaryCodedMatrixProps {
  codeframe: CodeframeEntry[];
  codedResponses: CodedResponse[];
  onDownloadMatrix: () => void;
}

const BinaryCodedMatrix: React.FC<BinaryCodedMatrixProps> = ({
  codeframe,
  codedResponses,
  onDownloadMatrix
}) => {
  // Create binary matrix
  const createBinaryMatrix = () => {
    return codedResponses.map(response => {
      const row: Record<string, number> = {
        ResponseText: response.responseText
      };
      
      codeframe.forEach(code => {
        row[code.label] = response.codesAssigned.includes(code.code) ? 1 : 0;
      });
      
      return row;
    });
  };

  const binaryMatrix = createBinaryMatrix();
  const previewRows = binaryMatrix.slice(0, 10);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="h-5 w-5" />
            Binary-Coded Matrix
          </div>
          <Button onClick={onDownloadMatrix} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Matrix
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Binary matrix showing code presence (1) or absence (0) for each response.
            Showing first 10 rows of {binaryMatrix.length} total responses.
          </p>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Response Text</TableHead>
                  {codeframe.map(code => (
                    <TableHead key={code.code} className="text-center min-w-[100px]">
                      <div className="space-y-1">
                        <div className="font-medium">{code.label}</div>
                        <div className="text-xs text-muted-foreground">({code.code})</div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="max-w-[200px] truncate">
                      {row.ResponseText as string}
                    </TableCell>
                    {codeframe.map(code => (
                      <TableCell key={code.code} className="text-center">
                        <span className={`font-mono ${
                          row[code.label] === 1 ? 'text-green-600 font-bold' : 'text-gray-400'
                        }`}>
                          {row[code.label]}
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {binaryMatrix.length > 10 && (
            <p className="text-center text-sm text-muted-foreground">
              ... and {binaryMatrix.length - 10} more rows
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BinaryCodedMatrix;
