
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, Download, Play, FileText } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';
import { toast } from './ui/use-toast';
import { CodeframeApplicator } from '../utils/codeframeApplication';

export const CodeframeApplication: React.FC = () => {
  const { 
    uploadedCodeframes, 
    activeCodeframe, 
    rawFileData, 
    fileColumns,
    setActiveCodeframe 
  } = useProcessing();
  
  const [isApplying, setIsApplying] = useState(false);
  const [appliedResults, setAppliedResults] = useState<any>(null);

  const handleApplyCodeframe = async () => {
    if (!activeCodeframe) {
      toast({
        variant: "destructive",
        title: "No Codeframe Selected",
        description: "Please select a codeframe to apply to the dataset."
      });
      return;
    }

    if (!rawFileData || rawFileData.length === 0) {
      toast({
        variant: "destructive",
        title: "No Dataset Available",
        description: "Please upload a verbatim dataset first."
      });
      return;
    }

    try {
      setIsApplying(true);
      
      // Create applicator with the active codeframe
      const applicator = new CodeframeApplicator(activeCodeframe);
      
      // Get question columns (text columns only)
      const questionColumns = fileColumns
        .filter(col => col.type === 'text')
        .map(col => col.name);
      
      if (questionColumns.length === 0) {
        throw new Error("No text columns found in the dataset");
      }
      
      // Apply codeframe to the data
      const codedResponses = applicator.applyCodeframe(rawFileData, questionColumns);
      
      // Generate Moniglew-style output
      const moniglewCsv = applicator.generateMoniglewOutput(codedResponses);
      
      setAppliedResults({
        codedResponses,
        moniglewCsv,
        questionsProcessed: questionColumns.length,
        responsesProcessed: codedResponses.length
      });
      
      toast({
        title: "Codeframe Applied Successfully",
        description: `Processed ${codedResponses.length} responses across ${questionColumns.length} questions using ${activeCodeframe.entries.length} codes.`
      });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Application Failed",
        description: error instanceof Error ? error.message : "An error occurred while applying the codeframe."
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleDownloadResults = () => {
    if (!appliedResults) return;
    
    const blob = new Blob([appliedResults.moniglewCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moniglew_applied_codeframe.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "Your Moniglew-style CSV is being downloaded."
    });
  };

  const handleDownloadJsonl = () => {
    if (!appliedResults) return;
    
    const jsonlContent = appliedResults.codedResponses
      .map((response: any) => JSON.stringify(response))
      .join('\n');
    
    const blob = new Blob([jsonlContent], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coded_responses.jsonl';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "JSONL Downloaded",
      description: "Your structured response data has been downloaded."
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Apply Codeframe to Verbatim Dataset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Use your uploaded codeframe as a standard taxonomy to automatically tag responses in your verbatim dataset.
          </div>
          
          {/* Codeframe Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Selected Codeframe</label>
            {activeCodeframe ? (
              <div className="p-3 border rounded-lg bg-muted/50">
                <div className="font-medium">{activeCodeframe.name}</div>
                <div className="text-sm text-muted-foreground">
                  {activeCodeframe.entries.length} codes available
                </div>
              </div>
            ) : (
              <div className="p-3 border rounded-lg border-dashed">
                <div className="text-sm text-muted-foreground">
                  No codeframe selected. Upload a codeframe first.
                </div>
              </div>
            )}
          </div>

          {/* Dataset Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Verbatim Dataset</label>
            {rawFileData && rawFileData.length > 0 ? (
              <div className="p-3 border rounded-lg bg-muted/50">
                <div className="font-medium">Dataset loaded</div>
                <div className="text-sm text-muted-foreground">
                  {rawFileData.length - 1} respondents, {fileColumns.filter(col => col.type === 'text').length} text columns
                </div>
              </div>
            ) : (
              <div className="p-3 border rounded-lg border-dashed">
                <div className="text-sm text-muted-foreground">
                  No dataset loaded. Upload a verbatim file first.
                </div>
              </div>
            )}
          </div>

          {/* Apply Button */}
          <Button 
            onClick={handleApplyCodeframe}
            disabled={!activeCodeframe || !rawFileData || isApplying}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {isApplying ? 'Applying Codeframe...' : 'Apply Codeframe to Dataset'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {appliedResults && (
        <Card>
          <CardHeader>
            <CardTitle>Application Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {appliedResults.responsesProcessed}
                </div>
                <div className="text-sm text-muted-foreground">Responses Coded</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {appliedResults.questionsProcessed}
                </div>
                <div className="text-sm text-muted-foreground">Questions Processed</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {activeCodeframe?.entries.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Codes Applied</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownloadResults} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Moniglew CSV
              </Button>
              <Button onClick={handleDownloadJsonl} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download JSONL
              </Button>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Output Preview</label>
              <div className="p-3 border rounded-lg bg-muted/50 font-mono text-xs overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {appliedResults.moniglewCsv.split('\n').slice(0, 10).join('\n')}
                  {appliedResults.moniglewCsv.split('\n').length > 10 && '\n... (truncated)'}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CodeframeApplication;
