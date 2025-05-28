
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertTriangle, Zap } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface SampleThresholdControlProps {
  totalResponses: number;
  currentThreshold: number;
  onThresholdChange: (threshold: number) => void;
  onApplyToAll: () => void;
  hasProcessedResults: boolean;
}

const SampleThresholdControl: React.FC<SampleThresholdControlProps> = ({
  totalResponses,
  currentThreshold,
  onThresholdChange,
  onApplyToAll,
  hasProcessedResults
}) => {
  const sampleSize = Math.floor((totalResponses * currentThreshold) / 100);
  const isSmallSample = sampleSize < 100;

  const handleSliderChange = (value: number[]) => {
    onThresholdChange(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 100) {
      onThresholdChange(value);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Sample Processing Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Sample Size</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="100"
                value={currentThreshold}
                onChange={handleInputChange}
                className="w-16 text-center"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          
          <Slider
            value={[currentThreshold]}
            onValueChange={handleSliderChange}
            max={100}
            min={1}
            step={5}
            className="w-full"
          />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fast Processing</span>
            <span className="text-muted-foreground">Full Dataset</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalResponses}</div>
            <div className="text-xs text-muted-foreground">Total Responses</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{sampleSize}</div>
            <div className="text-xs text-muted-foreground">Sample Size</div>
          </div>
          <div>
            <Badge variant={isSmallSample ? "destructive" : "default"} className="text-lg px-3 py-1">
              {currentThreshold}%
            </Badge>
          </div>
        </div>

        {isSmallSample && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Warning: Sample size is very small ({sampleSize} responses). 
              Consider increasing the threshold for more reliable results.
            </AlertDescription>
          </Alert>
        )}

        {hasProcessedResults && (
          <div className="pt-4 border-t">
            <Button 
              onClick={onApplyToAll} 
              className="w-full"
              variant="outline"
            >
              Apply Final Codeframe to All {totalResponses} Responses
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Once you're satisfied with the codeframe, apply it to the complete dataset
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SampleThresholdControl;
