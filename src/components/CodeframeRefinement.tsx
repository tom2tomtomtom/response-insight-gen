
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CodeframeEntry } from '../types';
import { Edit, Merge, Split, Save, RefreshCw } from 'lucide-react';
import { toast } from './ui/use-toast';

interface CodeframeRefinementProps {
  codeframe: CodeframeEntry[];
  onRefine: (refinedCodeframe: CodeframeEntry[], action: string) => void;
  isRefinementMode: boolean;
  onToggleRefinement: () => void;
}

interface RefinementAction {
  type: 'merge' | 'rename' | 'split';
  codes: string[];
  newLabel?: string;
  newDefinition?: string;
  splitInto?: { label: string; definition: string; examples: string[] }[];
}

const CodeframeRefinement: React.FC<CodeframeRefinementProps> = ({
  codeframe,
  onRefine,
  isRefinementMode,
  onToggleRefinement
}) => {
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [editingCode, setEditingCode] = useState<CodeframeEntry | null>(null);
  const [splitDialog, setSplitDialog] = useState(false);
  const [splitParts, setSplitParts] = useState<{ label: string; definition: string }[]>([
    { label: '', definition: '' },
    { label: '', definition: '' }
  ]);

  const handleCodeSelection = (code: string) => {
    setSelectedCodes(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleMergeCodes = () => {
    if (selectedCodes.length < 2) {
      toast({
        variant: "destructive",
        title: "Merge Error",
        description: "Please select at least 2 codes to merge"
      });
      return;
    }

    const mergedLabel = selectedCodes.join(' / ');
    const mergedDefinition = `Combined themes: ${selectedCodes.join(', ')}`;
    
    const refinedCodeframe = codeframe.map(entry => {
      if (selectedCodes.includes(entry.code)) {
        return selectedCodes[0] === entry.code ? {
          ...entry,
          label: mergedLabel,
          definition: mergedDefinition
        } : null;
      }
      return entry;
    }).filter(Boolean) as CodeframeEntry[];

    onRefine(refinedCodeframe, `Merged codes: ${selectedCodes.join(', ')}`);
    setSelectedCodes([]);
  };

  const handleRenameCode = (updatedCode: CodeframeEntry) => {
    const refinedCodeframe = codeframe.map(entry => 
      entry.code === updatedCode.code ? updatedCode : entry
    );
    
    onRefine(refinedCodeframe, `Renamed code: ${updatedCode.code}`);
    setEditingCode(null);
  };

  const handleSplitCode = (originalCode: string) => {
    if (splitParts.some(part => !part.label || !part.definition)) {
      toast({
        variant: "destructive",
        title: "Split Error",
        description: "Please fill in all labels and definitions"
      });
      return;
    }

    const originalEntry = codeframe.find(entry => entry.code === originalCode);
    if (!originalEntry) return;

    const refinedCodeframe = codeframe.reduce((acc, entry) => {
      if (entry.code === originalCode) {
        // Replace with split codes
        splitParts.forEach((part, index) => {
          acc.push({
            code: `${originalCode}_${index + 1}`,
            numeric: `${originalEntry.numeric}_${index + 1}`,
            label: part.label,
            definition: part.definition,
            examples: originalEntry.examples.slice(0, 2), // Distribute examples
            count: Math.floor((originalEntry.count || 0) / splitParts.length),
            percentage: ((originalEntry.percentage || 0) / splitParts.length)
          });
        });
      } else {
        acc.push(entry);
      }
      return acc;
    }, [] as CodeframeEntry[]);

    onRefine(refinedCodeframe, `Split code: ${originalCode} into ${splitParts.length} parts`);
    setSplitDialog(false);
    setSplitParts([{ label: '', definition: '' }, { label: '', definition: '' }]);
  };

  if (!isRefinementMode) {
    return (
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={onToggleRefinement}>
          <Edit className="h-4 w-4 mr-2" />
          Refine Codeframe
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Codeframe Refinement
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onToggleRefinement}>
              <Save className="h-4 w-4 mr-1" />
              Done
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex gap-2 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMergeCodes}
              disabled={selectedCodes.length < 2}
            >
              <Merge className="h-4 w-4 mr-1" />
              Merge Selected ({selectedCodes.length})
            </Button>
            
            <Dialog open={splitDialog} onOpenChange={setSplitDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={selectedCodes.length !== 1}
                >
                  <Split className="h-4 w-4 mr-1" />
                  Split Selected
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Split Code: {selectedCodes[0]}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {splitParts.map((part, index) => (
                    <div key={index} className="space-y-2">
                      <h4 className="font-medium">Part {index + 1}</h4>
                      <Input
                        placeholder="New code label"
                        value={part.label}
                        onChange={(e) => {
                          const newParts = [...splitParts];
                          newParts[index].label = e.target.value;
                          setSplitParts(newParts);
                        }}
                      />
                      <Textarea
                        placeholder="Definition"
                        value={part.definition}
                        onChange={(e) => {
                          const newParts = [...splitParts];
                          newParts[index].definition = e.target.value;
                          setSplitParts(newParts);
                        }}
                      />
                    </div>
                  ))}
                  <Button 
                    onClick={() => handleSplitCode(selectedCodes[0])}
                    className="w-full"
                  >
                    Split Code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Code list with selection */}
          <div className="space-y-2">
            {codeframe.map((entry) => (
              <div 
                key={entry.code}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedCodes.includes(entry.code) 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleCodeSelection(entry.code)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{entry.code}</Badge>
                      <span className="font-medium">{entry.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.definition}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCode(entry);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit dialog */}
        <Dialog open={!!editingCode} onOpenChange={() => setEditingCode(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Code: {editingCode?.code}</DialogTitle>
            </DialogHeader>
            {editingCode && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Label</label>
                  <Input
                    value={editingCode.label}
                    onChange={(e) => setEditingCode({
                      ...editingCode,
                      label: e.target.value
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Definition</label>
                  <Textarea
                    value={editingCode.definition}
                    onChange={(e) => setEditingCode({
                      ...editingCode,
                      definition: e.target.value
                    })}
                  />
                </div>
                <Button 
                  onClick={() => handleRenameCode(editingCode)}
                  className="w-full"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CodeframeRefinement;
