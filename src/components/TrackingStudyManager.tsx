
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Upload, Calendar, TrendingUp } from 'lucide-react';
import { TrackingStudyConfig, CodeframeEntry } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface TrackingStudyManagerProps {
  config: TrackingStudyConfig;
  onConfigChange: (config: TrackingStudyConfig) => void;
}

const TrackingStudyManager: React.FC<TrackingStudyManagerProps> = ({
  config,
  onConfigChange
}) => {
  const [uploadedCodeframe, setUploadedCodeframe] = useState<CodeframeEntry[]>([]);

  const handleCodeframeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Mock parsing - in real implementation, would parse Excel/CSV
    const mockCodeframe: CodeframeEntry[] = [
      {
        code: "1",
        numeric: "1",
        label: "Quality",
        definition: "Mentions of product quality",
        examples: ["High quality", "Good quality"],
        count: 45,
        percentage: 15.2
      },
      {
        code: "2", 
        numeric: "2",
        label: "Price",
        definition: "Price-related mentions",
        examples: ["Affordable", "Expensive"],
        count: 32,
        percentage: 10.8
      }
    ];

    setUploadedCodeframe(mockCodeframe);
    onConfigChange({
      ...config,
      isPriorCodeframe: true,
      priorCodeframe: mockCodeframe
    });
  };

  const updateWaveNumber = (waveNumber: number) => {
    onConfigChange({
      ...config,
      waveNumber
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tracking Study Configuration
          <Badge variant="secondary">Wave {config.waveNumber || 1}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Wave Number</Label>
            <Input
              type="number"
              min="1"
              value={config.waveNumber || 1}
              onChange={(e) => updateWaveNumber(parseInt(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Use Prior Wave Codeframe</Label>
              <p className="text-xs text-muted-foreground">
                Reuse codeframe from previous wave
              </p>
            </div>
            <Switch
              checked={config.isPriorCodeframe}
              onCheckedChange={(checked) => onConfigChange({
                ...config,
                isPriorCodeframe: checked
              })}
            />
          </div>
        </div>

        {config.isPriorCodeframe && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Prior Wave Codeframe</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleCodeframeUpload}
              />
              <p className="text-xs text-muted-foreground">
                Upload the codeframe from the previous wave to maintain consistency
              </p>
            </div>

            {uploadedCodeframe.length > 0 && (
              <div className="space-y-2">
                <Label>Prior Wave Codeframe Preview</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>Definition</TableHead>
                        <TableHead>Examples</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadedCodeframe.slice(0, 5).map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{entry.code}</TableCell>
                          <TableCell>{entry.label}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{entry.definition}</TableCell>
                          <TableCell>
                            {entry.examples.slice(0, 2).join(', ')}
                            {entry.examples.length > 2 && '...'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {uploadedCodeframe.length > 5 && (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      +{uploadedCodeframe.length - 5} more codes
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Tracking Study Features</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• New codes will be marked as "*New – Wave {config.waveNumber || 1}*"</li>
            <li>• Code order and definitions maintained from prior wave</li>
            <li>• Automatic comparison with previous wave results</li>
            <li>• Trend analysis and changes highlighting</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackingStudyManager;
