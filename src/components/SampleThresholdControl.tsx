
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';

const SampleThresholdControl: React.FC = () => {
  const { rawResponses, codeframeRules, setCodeframeRules } = useProcessing();
  const [samplePercentage, setSamplePercentage] = useState(30);
  const [minimumPercentage, setMinimumPercentage] = useState(3);

  const totalResponses = rawResponses.length;
  const sampleSize = Math.floor((samplePercentage / 100) * totalResponses);
  const remainingResponses = totalResponses - sampleSize;

  const handleSamplePercentageChange = (value: number[]) => {
    setSamplePercentage(value[0]);
  };

  const handleMinimumPercentageChange = (value: number[]) => {
    const newValue = value[0];
    setMinimumPercentage(newValue);
    setCodeframeRules({
      ...codeframeRules,
      minimumPercentage: newValue
    });
  };

  const getSampleSizeWarning = () => {
    if (sampleSize < 100) {
      return { type: 'error', message: 'Sample size too small - results may not be reliable' };
    }
    if (sampleSize < 300) {
      return { type: 'warning', message: 'Small sample size - consider increasing for better reliability' };
    }
    return null;
  };

  const warning = getSampleSizeWarning();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sample & Threshold Control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Sample Size for Initial Codeframe</Label>
              <Badge variant="outline" className="text-xs">
                {sampleSize} responses
              </Badge>
            </div>
            <Slider
              value={[samplePercentage]}
              onValueChange={handleSamplePercentageChange}
              max={100}
              min={10}
              step={5}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>10%</span>
              <span>{samplePercentage}% ({sampleSize} responses)</span>
              <span>100%</span>
            </div>
          </div>

          {warning && (
            <Alert variant={warning.type === 'error' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {warning.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-blue-700">Sample Strategy:</div>
                <div>Use {sampleSize} responses to build the codeframe, then apply to all {totalResponses} responses.</div>
                <div className="mt-1">Remaining {remainingResponses} responses will be coded using the finalized codeframe.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Minimum Code Frequency</Label>
            <Badge variant="outline" className="text-xs">
              ≥{minimumPercentage}%
            </Badge>
          </div>
          <Slider
            value={[minimumPercentage]}
            onValueChange={handleMinimumPercentageChange}
            max={10}
            min={1}
            step={0.5}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>1%</span>
            <span>{minimumPercentage}%</span>
            <span>10%</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Only include codes mentioned by at least {minimumPercentage}% of responses
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{sampleSize}</div>
            <div className="text-xs text-muted-foreground">Sample for Codeframe</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">{remainingResponses}</div>
            <div className="text-xs text-muted-foreground">Apply to Remaining</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SampleThresholdControl;
