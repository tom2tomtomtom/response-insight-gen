import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  GitBranch, 
  TrendingUp, 
  TrendingDown,
  Save,
  Download,
  Clock,
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from './ui/use-toast';
import { useProcessing } from '../contexts/ProcessingContext';
import { 
  TrackingStudyManager, 
  StudyVersion, 
  TrackingStudyConfig 
} from '../utils/trackingStudyVersion';

const TrackingStudyVersionManager: React.FC = () => {
  const { results, projectContext } = useProcessing();
  const [studyConfig, setStudyConfig] = useState<TrackingStudyConfig>({
    studyId: projectContext?.name || 'study_001',
    studyName: projectContext?.name || 'Unnamed Study',
    isTrackingStudy: true,
    comparisonMode: 'wave-over-wave',
    autoDetectChanges: true,
    significanceThreshold: 5
  });
  
  const [wave, setWave] = useState('');
  const [description, setDescription] = useState('');
  const [versions, setVersions] = useState<StudyVersion[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<[string?, string?]>([]);
  const [comparisonReport, setComparisonReport] = useState<string>('');
  
  // Load versions on mount and when study changes
  useEffect(() => {
    if (studyConfig.studyId) {
      const studyVersions = TrackingStudyManager.getStudyVersions(studyConfig.studyId);
      setVersions(studyVersions);
      
      // Auto-select latest two versions for comparison
      if (studyVersions.length >= 2) {
        setSelectedVersions([
          studyVersions[studyVersions.length - 2].id,
          studyVersions[studyVersions.length - 1].id
        ]);
      }
    }
  }, [studyConfig.studyId]);
  
  // Generate comparison report when versions change
  useEffect(() => {
    if (selectedVersions[0] && selectedVersions[1]) {
      const v1 = versions.find(v => v.id === selectedVersions[0]);
      const v2 = versions.find(v => v.id === selectedVersions[1]);
      
      if (v1 && v2) {
        const report = TrackingStudyManager.generateComparisonReport(v1, v2);
        setComparisonReport(report);
      }
    }
  }, [selectedVersions, versions]);
  
  const saveVersion = () => {
    if (!results) {
      toast({
        variant: 'destructive',
        title: 'No Results Available',
        description: 'Please process data before saving a version.',
      });
      return;
    }
    
    if (!wave.trim()) {
      toast({
        variant: 'destructive',
        title: 'Wave Required',
        description: 'Please enter a wave identifier (e.g., Q1 2024, Wave 1).',
      });
      return;
    }
    
    try {
      const newVersion = TrackingStudyManager.saveVersion(
        results,
        projectContext?.name || 'Unnamed Project',
        wave,
        studyConfig,
        description
      );
      
      // Refresh versions
      const updatedVersions = TrackingStudyManager.getStudyVersions(studyConfig.studyId);
      setVersions(updatedVersions);
      
      // Clear form
      setWave('');
      setDescription('');
      
      toast({
        title: 'Version Saved',
        description: `${wave} has been saved as version ${newVersion.versionNumber}.`,
      });
      
      // Show changes if applicable
      if (newVersion.changesSummary && studyConfig.autoDetectChanges) {
        const { newCodes, percentageChanges } = newVersion.changesSummary;
        if (newCodes.length > 0 || percentageChanges.length > 0) {
          setTimeout(() => {
            toast({
              title: 'Changes Detected',
              description: `${newCodes.length} new codes, ${percentageChanges.length} significant changes.`,
            });
          }, 1000);
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save version.',
      });
    }
  };
  
  const exportTrackingData = () => {
    try {
      const csv = TrackingStudyManager.exportTrackingData(studyConfig.studyId);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studyConfig.studyName}_tracking_data.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: 'Tracking data has been exported.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export tracking data.',
      });
    }
  };
  
  const getChangeIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (delta < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Tracking Study Version Management
        </CardTitle>
        <CardDescription>
          Manage versions and track changes across waves for longitudinal studies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="save" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="save">Save Version</TabsTrigger>
            <TabsTrigger value="versions">Version History</TabsTrigger>
            <TabsTrigger value="compare">Compare Waves</TabsTrigger>
          </TabsList>
          
          <TabsContent value="save" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="wave">Wave Identifier</Label>
                <Input
                  id="wave"
                  value={wave}
                  onChange={(e) => setWave(e.target.value)}
                  placeholder="e.g., Q1 2024, Wave 1, January 2024"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Enter a unique identifier for this wave of data collection
                </p>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Post-campaign launch, Holiday season data"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Comparison Mode</Label>
                <Select
                  value={studyConfig.comparisonMode}
                  onValueChange={(value: any) => 
                    setStudyConfig({ ...studyConfig, comparisonMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wave-over-wave">Wave-over-Wave</SelectItem>
                    <SelectItem value="vs-baseline">vs. Baseline</SelectItem>
                    <SelectItem value="all-waves">All Waves</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {results && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Current data: {results.codedResponses.length} responses, {results.codeframe.length} codes
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={saveVersion} 
                className="w-full"
                disabled={!results || !wave}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Current Version
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="versions" className="space-y-4">
            {versions.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No versions saved yet. Save your first version to start tracking changes.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div 
                    key={version.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">v{version.versionNumber}</Badge>
                        <span className="font-medium">{version.wave}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Responses:</span>{' '}
                        {version.metadata.totalResponses}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Codes:</span>{' '}
                        {version.metadata.codeframeSize}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Columns:</span>{' '}
                        {version.metadata.columnsProcessed}
                      </div>
                    </div>
                    
                    {version.description && (
                      <p className="text-sm text-muted-foreground">{version.description}</p>
                    )}
                    
                    {version.changesSummary && (
                      <div className="flex gap-2">
                        {version.changesSummary.newCodes.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            +{version.changesSummary.newCodes.length} new
                          </Badge>
                        )}
                        {version.changesSummary.percentageChanges.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {version.changesSummary.percentageChanges.length} changes
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={exportTrackingData}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Tracking Data
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="compare" className="space-y-4">
            {versions.length < 2 ? (
              <Alert>
                <AlertDescription>
                  At least 2 versions are needed for comparison. Save more versions to compare waves.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From Version</Label>
                    <Select
                      value={selectedVersions[0]}
                      onValueChange={(value) => 
                        setSelectedVersions([value, selectedVersions[1]])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.wave} (v{v.versionNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>To Version</Label>
                    <Select
                      value={selectedVersions[1]}
                      onValueChange={(value) => 
                        setSelectedVersions([selectedVersions[0], value])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select version" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.wave} (v{v.versionNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {comparisonReport && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {comparisonReport}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrackingStudyVersionManager;