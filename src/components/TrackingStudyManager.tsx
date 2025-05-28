
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, TrendingUp, FileText } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';
import { CodeframeEntry, TrackingStudyConfig } from '../types';

interface TrackingStudyManagerProps {
  onConfigurationChange: (config: TrackingStudyConfig) => void;
}

const TrackingStudyManager: React.FC<TrackingStudyManagerProps> = ({
  onConfigurationChange
}) => {
  const { trackingConfig, setTrackingConfig } = useProcessing();
  const [uploadedCodeframe, setUploadedCodeframe] = useState<CodeframeEntry[] | null>(null);
  const [codeframeFile, setCodeframeFile] = useState<File | null>(null);

  const handleTrackingToggle = (isPrior: boolean) => {
    const newConfig = {
      ...trackingConfig,
      isPriorCodeframe: isPrior,
      priorCodeframe: isPrior ? uploadedCodeframe || undefined : undefined
    };
    setTrackingConfig(newConfig);
    onConfigurationChange(newConfig);
  };

  const handleWaveNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const waveNumber = parseInt(e.target.value) || 1;
    const newConfig = {
      ...trackingConfig,
      waveNumber
    };
    setTrackingConfig(newConfig);
    onConfigurationChange(newConfig);
  };

  const handleCodeframeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCodeframeFile(file);
    
    // In a real implementation, you would parse the file here
    // For now, we'll simulate a parsed codeframe
    const simulatedCodeframe: CodeframeEntry[] = [
      {
        code: "BRAND_A",
        numeric: "1",
        label: "Brand A",
        definition: "References to Brand A",
        examples: ["Brand A", "A brand"]
      },
      {
        code: "BRAND_B", 
        numeric: "2",
        label: "Brand B",
        definition: "References to Brand B",
        examples: ["Brand B", "B brand"]
      }
    ];
    
    setUploadedCodeframe(simulatedCodeframe);
    
    const newConfig = {
      ...trackingConfig,
      priorCodeframe: simulatedCodeframe
    };
    setTrackingConfig(newConfig);
    onConfigurationChange(newConfig);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tracking Study Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Use Prior Wave Codeframe</Label>
            <p className="text-sm text-muted-foreground">
              Reuse existing codes from previous wave
            </p>
          </div>
          <Switch
            checked={trackingConfig.isPriorCodeframe}
            onCheckedChange={handleTrackingToggle}
          />
        </div>

        {trackingConfig.isPriorCodeframe && (
          <>
            <div className="space-y-2">
              <Label>Wave Number</Label>
              <Input
                type="number"
                value={trackingConfig.waveNumber}
                onChange={handleWaveNumberChange}
                className="w-32"
                min="1"
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Prior Codeframe</Label>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleCodeframeUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  {codeframeFile ? codeframeFile.name : 'Choose Codeframe File'}
                </Button>
              </div>
            </div>

            {uploadedCodeframe && (
              <Alert className="bg-green-50 border-green-200">
                <FileText className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  <div className="flex items-center justify-between">
                    <span>Prior codeframe loaded successfully</span>
                    <Badge variant="outline" className="text-green-600">
                      {uploadedCodeframe.length} codes
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Tracking Study Logic:</strong> New codes will be marked as 
                <Badge variant="secondary" className="mx-1">*New – Wave {trackingConfig.waveNumber}*</Badge> 
                and added to the end of the codeframe while maintaining existing order and definitions.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TrackingStudyManager;
