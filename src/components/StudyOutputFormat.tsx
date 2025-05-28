import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { FileSpreadsheet, BarChart3, Download } from 'lucide-react';
import { ProcessedResult } from '../types';
import { MoniglewStyleFormatter } from '../utils/moniglewStyleFormatter';
interface StudyOutputFormatProps {
  results: ProcessedResult;
  studyId?: string;
}
const StudyOutputFormat: React.FC<StudyOutputFormatProps> = ({
  results,
  studyId = "20250128"
}) => {
  const formatter = useMemo(() => new MoniglewStyleFormatter(results), [results]);
  const columnMetadata = useMemo(() => formatter.getColumnMetadata(), [formatter]);
  const handleDownloadMoniglewCSV = () => {
    const csv = formatter.generateCSV();
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `moniglew_style_output_${studyId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group columns by type for display
  const verbatimColumns = columnMetadata.filter(meta => meta.column.type === 'verbatim');
  const codeColumns = columnMetadata.filter(meta => meta.column.type === 'code');
  const thematicColumns = columnMetadata.filter(meta => meta.column.type === 'thematic');
  const grandNets = thematicColumns.filter(meta => meta.column.hierarchyLevel === 'Grand Net');
  const nets = thematicColumns.filter(meta => meta.column.hierarchyLevel === 'Net');
  const subnets = thematicColumns.filter(meta => meta.column.hierarchyLevel === 'Subnet');
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Moniglew-Style Brand Tracking Output
          </div>
          <Button onClick={handleDownloadMoniglewCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{verbatimColumns.length}</div>
            <div className="text-sm text-muted-foreground">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{codeColumns.length}</div>
            <div className="text-sm text-muted-foreground">Code Columns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{grandNets.length}</div>
            <div className="text-sm text-muted-foreground">Grand Nets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{nets.length}</div>
            <div className="text-sm text-muted-foreground">Nets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">{subnets.length}</div>
            <div className="text-sm text-muted-foreground">Subnets</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <h3 className="font-medium">Column Structure Preview</h3>
            <Badge variant="outline">Industry Standard Format</Badge>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Hierarchy</TableHead>
                  <TableHead>Sample Values</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columnMetadata.slice(0, 15).map((meta, index) => <TableRow key={index}>
                    <TableCell className="font-mono text-sm max-w-[300px]">
                      <div className="truncate" title={meta.column.name}>
                        {meta.column.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.column.type === 'verbatim' ? 'default' : meta.column.type === 'code' ? 'secondary' : 'outline'}>
                        {meta.column.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{meta.column.dataType}</Badge>
                    </TableCell>
                    <TableCell>
                      {meta.column.hierarchyLevel && <Badge variant="secondary" className="text-xs">
                          {meta.column.hierarchyLevel}
                        </Badge>}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="text-xs text-muted-foreground truncate">
                        {meta.sampleValues.length > 0 ? meta.sampleValues.slice(0, 2).join(', ') : 'No data'}
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </div>
          
          {columnMetadata.length > 15 && <p className="text-center text-sm text-muted-foreground">
              ... and {columnMetadata.length - 15} more columns including all thematic hierarchies
            </p>}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Monigle Format Specifications</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Column naming: <code>&lt;QID&gt;*&lt;Theme Description&gt; (&lt;Hierarchy Level&gt;)*\[Code Number]</code></li>
            <li>• Verbatim columns contain raw response text</li>
            <li>• Code columns (1-10) contain integer code values</li>
            <li>• Thematic columns use binary encoding (1 = applies, blank = not coded)</li>
            <li>• Three-tier hierarchy: Grand Net → Net → Subnet</li>
          </ul>
        </div>
      </CardContent>
    </Card>;
};
export default StudyOutputFormat;