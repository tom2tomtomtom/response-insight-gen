
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import { AlertTriangle, Target, Database } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';

interface SampleThresholdControlProps {
  onThresholdChange: (threshold: number) => void;
  onApplyToFullDataset: () => void;
  isCodeframeFinalized: boolean;
}

const SampleThresholdControl: React.FC<SampleThresholdControlProps> = ({
  onThresholdChange,
  onApplyToFullDataset,
  isCodeframeFinalized
}) => {
  const { rawResponses, results } = useProcessing();
  const [threshold, setThreshold] = useState(30);
  const [customThreshold, setCustomThreshold] = useState('30');

  const totalResponses = rawResponses.length;
  const sampleSize = Math.floor((threshold / 100) * totalResponses);
  const isSampleTooSmall = sampleSize < 50;

  const handleSliderChange = (value: number[]) => {
    const newThreshold = value[0];
    setThreshold(newThreshold);
    setCustomThreshold(newThreshold.toString());
    onThresholdChange(newThreshold);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomThreshold(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
      setThreshold(numValue);
      onThresholdChange(numValue);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Sample Threshold Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Sample Percentage</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[threshold]}
                onValueChange={handleSliderChange}
                max={100}
                min={1}
                step={1}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={customThreshold}
                  onChange={handleInputChange}
                  className="w-16 h-8"
                  min="1"
                  max="100"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalResponses}</div>
              <div className="text-sm text-muted-foreground">Total Responses</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{sampleSize}</div>
              <div className="text-sm text-muted-foreground">Sample Size</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{threshold}%</div>
              <div className="text-sm text-muted-foreground">Threshold</div>
            </div>
          </div>

          {isSampleTooSmall && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-700">
                <strong>Warning:</strong> Sample size is below 50 responses. 
                Consider increasing the threshold for more reliable results.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Sampling Strategy:</strong> The AI will analyze {sampleSize} responses 
              to generate the initial codeframe. Once approved, you can apply it to the full dataset.
            </p>
          </div>

          {results && isCodeframeFinalized && (
            <div className="pt-4 border-t">
              <Button 
                onClick={onApplyToFullDataset}
                className="w-full flex items-center gap-2"
                size="lg"
              >
                <Database className="h-4 w-4" />
                Apply Codeframe to Full Dataset ({totalResponses} responses)
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SampleThresholdControl;
