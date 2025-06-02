import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Sparkles, 
  Check, 
  X, 
  RefreshCw,
  Info,
  Zap
} from 'lucide-react';
import { toast } from './ui/use-toast';
import { useProcessing } from '../contexts/ProcessingContext';
import { QuestionGroupingAutomation } from '../utils/questionGrouping';
import { QuestionType } from '../contexts/types';

interface GroupingSuggestion {
  columnIndex: number;
  columnName: string;
  suggestedType: QuestionType;
  confidence: number;
  reason: string;
  accepted: boolean | null;
}

const QuestionGroupingAutomationComponent: React.FC = () => {
  const { 
    fileColumns, 
    selectedColumns,
    columnQuestionTypes,
    setColumnQuestionType
  } = useProcessing();
  
  const [suggestions, setSuggestions] = useState<GroupingSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.6);
  
  const selectedTextColumns = selectedColumns
    .map(idx => fileColumns.find(col => col.index === idx))
    .filter(Boolean) as Array<{ name: string; index: number }>;
  
  const analyzeQuestions = () => {
    setIsAnalyzing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      const results = QuestionGroupingAutomation.getSuggestions(
        selectedTextColumns,
        confidenceThreshold
      );
      
      const suggestionList: GroupingSuggestion[] = Object.entries(results).map(
        ([index, suggestion]) => ({
          columnIndex: parseInt(index),
          columnName: fileColumns.find(c => c.index === parseInt(index))?.name || '',
          suggestedType: suggestion.type,
          confidence: suggestion.confidence,
          reason: suggestion.reason,
          accepted: null
        })
      );
      
      setSuggestions(suggestionList);
      setIsAnalyzing(false);
      
      if (suggestionList.length === 0) {
        toast({
          title: 'No Suggestions Found',
          description: 'Unable to detect question patterns. Try lowering the confidence threshold.',
        });
      } else {
        toast({
          title: 'Analysis Complete',
          description: `Found ${suggestionList.length} question grouping suggestions.`,
        });
      }
    }, 1000);
  };
  
  const acceptSuggestion = (suggestion: GroupingSuggestion) => {
    setColumnQuestionType(suggestion.columnIndex, suggestion.suggestedType);
    setSuggestions(prev => 
      prev.map(s => 
        s.columnIndex === suggestion.columnIndex 
          ? { ...s, accepted: true }
          : s
      )
    );
  };
  
  const rejectSuggestion = (suggestion: GroupingSuggestion) => {
    setSuggestions(prev => 
      prev.map(s => 
        s.columnIndex === suggestion.columnIndex 
          ? { ...s, accepted: false }
          : s
      )
    );
  };
  
  const acceptAllSuggestions = () => {
    suggestions.forEach(suggestion => {
      if (suggestion.accepted !== false) {
        setColumnQuestionType(suggestion.columnIndex, suggestion.suggestedType);
      }
    });
    
    setSuggestions(prev => 
      prev.map(s => s.accepted !== false ? { ...s, accepted: true } : s)
    );
    
    toast({
      title: 'All Suggestions Applied',
      description: `Applied ${suggestions.filter(s => s.accepted !== false).length} question type assignments.`,
    });
  };
  
  const getTypeColor = (type: QuestionType) => {
    switch (type) {
      case 'brand_awareness':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'brand_description':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  const getTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'brand_awareness':
        return 'Brand Awareness';
      case 'brand_description':
        return 'Brand Description';
      default:
        return 'Miscellaneous';
    }
  };
  
  if (selectedColumns.length === 0) {
    return null;
  }
  
  const pendingSuggestions = suggestions.filter(s => s.accepted === null);
  const acceptedSuggestions = suggestions.filter(s => s.accepted === true);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Question Grouping Automation
        </CardTitle>
        <CardDescription>
          Automatically detect and group similar questions for consistent codeframe generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Analyze {selectedTextColumns.length} selected columns for question patterns
            </p>
          </div>
          <Button
            onClick={analyzeQuestions}
            disabled={isAnalyzing || selectedTextColumns.length === 0}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Auto-Detect Groups
              </>
            )}
          </Button>
        </div>
        
        {/* Results */}
        {suggestions.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {pendingSuggestions.length} pending
                </Badge>
                <Badge variant="secondary">
                  {acceptedSuggestions.length} accepted
                </Badge>
              </div>
              {pendingSuggestions.length > 0 && (
                <Button
                  onClick={acceptAllSuggestions}
                  size="sm"
                  variant="secondary"
                >
                  Accept All Pending
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.columnIndex}
                  className={`border rounded-lg p-3 ${
                    suggestion.accepted === true 
                      ? 'bg-green-50 border-green-200' 
                      : suggestion.accepted === false
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {suggestion.columnName}
                        </span>
                        <Badge 
                          className={getTypeColor(suggestion.suggestedType)}
                          variant="outline"
                        >
                          {getTypeLabel(suggestion.suggestedType)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Progress 
                            value={suggestion.confidence * 100} 
                            className="w-16 h-2"
                          />
                          <span>{Math.round(suggestion.confidence * 100)}%</span>
                        </div>
                        <span className="text-xs">{suggestion.reason}</span>
                      </div>
                    </div>
                    
                    {suggestion.accepted === null && (
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => acceptSuggestion(suggestion)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          onClick={() => rejectSuggestion(suggestion)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                    
                    {suggestion.accepted === true && (
                      <Badge variant="secondary" className="bg-green-100">
                        <Check className="h-3 w-3 mr-1" />
                        Applied
                      </Badge>
                    )}
                    
                    {suggestion.accepted === false && (
                      <Badge variant="secondary" className="bg-red-100">
                        <X className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Help Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Question grouping helps create more accurate codeframes by processing similar questions together. 
            The system detects patterns in question text to suggest appropriate groupings.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default QuestionGroupingAutomationComponent;