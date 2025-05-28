
import React, { useState, useEffect } from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  Loader2, 
  FileText, 
  Brain, 
  Target, 
  Sparkles, 
  BarChart3,
  Clock,
  Zap,
  Eye
} from 'lucide-react';
import { Button } from './ui/button';

interface ProcessingStage {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  progress: number;
  status: 'pending' | 'active' | 'complete';
  liveStats?: {
    processed: number;
    total: number;
    rate: string;
  };
}

const EnhancedProcessingStatus: React.FC = () => {
  const { 
    isProcessing, 
    processingStatus, 
    processingProgress,
    selectedColumns,
    results 
  } = useProcessing();
  
  const [currentStage, setCurrentStage] = useState(0);
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  const [liveStats, setLiveStats] = useState({
    responsesProcessed: 0,
    codesIdentified: 0,
    themesEmerging: 0,
    insightsGenerated: 0
  });
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Define processing stages with more detail
  const stages: ProcessingStage[] = [
    {
      id: 'preparation',
      title: 'Data Preparation',
      description: 'Parsing file structure and cleaning response data',
      icon: FileText,
      progress: Math.min(processingProgress * 4, 100),
      status: processingProgress < 25 ? (isProcessing ? 'active' : 'pending') : 'complete'
    },
    {
      id: 'analysis',
      title: 'AI Analysis',
      description: 'Deep learning algorithms analyzing response patterns',
      icon: Brain,
      progress: Math.max(0, Math.min((processingProgress - 25) * 4, 100)),
      status: processingProgress < 25 ? 'pending' : processingProgress < 50 ? 'active' : 'complete',
      liveStats: {
        processed: liveStats.responsesProcessed,
        total: 1000, // This would come from actual data
        rate: '45 responses/sec'
      }
    },
    {
      id: 'codeframe',
      title: 'Codeframe Generation',
      description: 'Building intelligent code structures and hierarchies',
      icon: Target,
      progress: Math.max(0, Math.min((processingProgress - 50) * 4, 100)),
      status: processingProgress < 50 ? 'pending' : processingProgress < 75 ? 'active' : 'complete',
      liveStats: {
        processed: liveStats.codesIdentified,
        total: 50,
        rate: '3 codes/sec'
      }
    },
    {
      id: 'insights',
      title: 'Insights Generation',
      description: 'Extracting meaningful patterns and generating insights',
      icon: Sparkles,
      progress: Math.max(0, Math.min((processingProgress - 75) * 4, 100)),
      status: processingProgress < 75 ? 'pending' : processingProgress < 100 ? 'active' : 'complete',
      liveStats: {
        processed: liveStats.insightsGenerated,
        total: 15,
        rate: '2 insights/sec'
      }
    }
  ];

  // Simulate real-time updates during processing
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      // Update live stats
      setLiveStats(prev => ({
        responsesProcessed: Math.min(prev.responsesProcessed + Math.floor(Math.random() * 10), 1000),
        codesIdentified: Math.min(prev.codesIdentified + Math.floor(Math.random() * 2), 50),
        themesEmerging: Math.min(prev.themesEmerging + Math.floor(Math.random() * 1), 25),
        insightsGenerated: Math.min(prev.insightsGenerated + Math.floor(Math.random() * 1), 15)
      }));

      // Add processing log entries
      const logMessages = [
        "Analyzing brand mentions and sentiment...",
        "Identifying recurring themes and patterns...",
        "Processing open-ended responses...",
        "Generating semantic clusters...",
        "Building hierarchical code structure...",
        "Extracting key insights...",
        "Mapping responses to codes...",
        "Calculating confidence scores..."
      ];
      
      if (Math.random() > 0.7) {
        const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
        setProcessingLog(prev => [...prev.slice(-4), randomMessage]);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // Update current stage based on progress
  useEffect(() => {
    if (processingProgress < 25) setCurrentStage(0);
    else if (processingProgress < 50) setCurrentStage(1);
    else if (processingProgress < 75) setCurrentStage(2);
    else setCurrentStage(3);
  }, [processingProgress]);

  if (!isProcessing && processingProgress === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {processingProgress < 100 ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <span>
              {processingProgress < 100 ? 'AI Analysis in Progress' : 'Analysis Complete!'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="animate-pulse">
              {selectedColumns.length} columns
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailedView(!showDetailedView)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showDetailedView ? 'Simple' : 'Detailed'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{processingStatus}</span>
            <span className="text-muted-foreground">{processingProgress}%</span>
          </div>
          <Progress value={processingProgress} className="h-3" />
        </div>

        {/* Processing Stages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage, index) => {
            const StageIcon = stage.icon;
            const isActive = stage.status === 'active';
            const isComplete = stage.status === 'complete';
            
            return (
              <div
                key={stage.id}
                className={`p-4 rounded-lg border transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary/5 border-primary shadow-md scale-105' 
                    : isComplete 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-muted/50 border-muted'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <StageIcon 
                    className={`h-5 w-5 ${
                      isActive ? 'text-primary animate-pulse' : 
                      isComplete ? 'text-green-500' : 'text-muted-foreground'
                    }`} 
                  />
                  <span className="font-medium text-sm">{stage.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{stage.description}</p>
                
                {stage.progress > 0 && (
                  <Progress value={stage.progress} className="h-1 mb-2" />
                )}
                
                {showDetailedView && isActive && stage.liveStats && (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Processed:</span>
                      <span className="font-mono">{stage.liveStats.processed}/{stage.liveStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span className="font-mono text-primary">{stage.liveStats.rate}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Statistics Panel */}
        {showDetailedView && isProcessing && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{liveStats.responsesProcessed}</div>
              <div className="text-xs text-muted-foreground">Responses Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{liveStats.codesIdentified}</div>
              <div className="text-xs text-muted-foreground">Codes Identified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{liveStats.themesEmerging}</div>
              <div className="text-xs text-muted-foreground">Themes Emerging</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{liveStats.insightsGenerated}</div>
              <div className="text-xs text-muted-foreground">Insights Generated</div>
            </div>
          </div>
        )}

        {/* Processing Log */}
        {showDetailedView && processingLog.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Processing Activity</span>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
              {processingLog.map((message, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">{message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>High-performance AI processing active</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedProcessingStatus;
