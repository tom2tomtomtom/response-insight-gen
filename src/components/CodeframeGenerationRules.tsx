
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Settings } from 'lucide-react';
import { CodeframeGenerationRules as RulesType } from '../types';

interface CodeframeGenerationRulesProps {
  rules: RulesType;
  onRulesChange: (rules: RulesType) => void;
}

const CodeframeGenerationRules: React.FC<CodeframeGenerationRulesProps> = ({
  rules,
  onRulesChange
}) => {
  const updateRule = (key: keyof RulesType, value: any) => {
    onRulesChange({
      ...rules,
      [key]: value
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Codeframe Generation Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Minimum Percentage Threshold</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[rules.minimumPercentage]}
              onValueChange={(value) => updateRule('minimumPercentage', value[0])}
              max={10}
              min={1}
              step={0.5}
              className="flex-1"
            />
            <Badge variant="outline">{rules.minimumPercentage}%</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Codes below this threshold will be grouped into "Other"
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Include Catch-all Codes</Label>
            <p className="text-xs text-muted-foreground">
              Always include Other, None, N/A codes
            </p>
          </div>
          <Switch
            checked={rules.includeCatchalls}
            onCheckedChange={(checked) => updateRule('includeCatchalls', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Use Numeric IDs Only</Label>
            <p className="text-xs text-muted-foreground">
              Remove alphanumeric codes (C1, C2 format)
            </p>
          </div>
          <Switch
            checked={rules.useNumericIds}
            onCheckedChange={(checked) => updateRule('useNumericIds', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Enforce Thresholds</Label>
            <p className="text-xs text-muted-foreground">
              Strictly apply minimum percentage rules
            </p>
          </div>
          <Switch
            checked={rules.enforceThresholds}
            onCheckedChange={(checked) => updateRule('enforceThresholds', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeframeGenerationRules;
