import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Edit2, 
  Merge, 
  Split, 
  Trash2, 
  Plus,
  Save,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { CodeframeEntry } from '../types';
import { toast } from './ui/use-toast';

interface CodeframeEditorProps {
  codeframe: CodeframeEntry[];
  onCodeframeChange: (newCodeframe: CodeframeEntry[]) => void;
  isEditable: boolean;
}

type EditAction = 'merge' | 'split' | 'rename' | 'delete' | 'add' | null;

const CodeframeEditor: React.FC<CodeframeEditorProps> = ({
  codeframe,
  onCodeframeChange,
  isEditable
}) => {
  const [localCodeframe, setLocalCodeframe] = useState<CodeframeEntry[]>(codeframe);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [editAction, setEditAction] = useState<EditAction>(null);
  const [editingCode, setEditingCode] = useState<CodeframeEntry | null>(null);
  const [mergeTargetCode, setMergeTargetCode] = useState<string>('');
  const [splitNewCodes, setSplitNewCodes] = useState<{ label: string; definition: string }[]>([
    { label: '', definition: '' },
    { label: '', definition: '' }
  ]);
  const [newCodeData, setNewCodeData] = useState({
    label: '',
    definition: '',
    numeric: ''
  });

  useEffect(() => {
    setLocalCodeframe(codeframe);
  }, [codeframe]);

  const handleCodeSelect = (code: string) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter(c => c !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  const handleMerge = () => {
    if (selectedCodes.length < 2) {
      toast({
        variant: "destructive",
        title: "Select at least 2 codes",
        description: "You need to select at least 2 codes to merge"
      });
      return;
    }
    setEditAction('merge');
  };

  const confirmMerge = () => {
    if (!mergeTargetCode) return;

    const targetCode = localCodeframe.find(c => c.code === mergeTargetCode);
    if (!targetCode) return;

    // Get all codes to merge
    const codesToMerge = localCodeframe.filter(c => 
      selectedCodes.includes(c.code) && c.code !== mergeTargetCode
    );

    // Combine examples
    const allExamples = [
      ...(targetCode.examples || []),
      ...codesToMerge.flatMap(c => c.examples || [])
    ];

    // Update target code
    const updatedTarget = {
      ...targetCode,
      examples: [...new Set(allExamples)], // Remove duplicates
      count: (targetCode.count || 0) + codesToMerge.reduce((sum, c) => sum + (c.count || 0), 0),
      definition: `${targetCode.definition} (Merged with: ${codesToMerge.map(c => c.label).join(', ')})`
    };

    // Remove merged codes and update target
    const newCodeframe = localCodeframe
      .filter(c => !selectedCodes.includes(c.code) || c.code === mergeTargetCode)
      .map(c => c.code === mergeTargetCode ? updatedTarget : c);

    setLocalCodeframe(newCodeframe);
    onCodeframeChange(newCodeframe);
    
    // Reset state
    setSelectedCodes([]);
    setEditAction(null);
    setMergeTargetCode('');
    
    toast({
      title: "Codes merged",
      description: `${codesToMerge.length} codes merged into ${targetCode.label}`
    });
  };

  const handleSplit = (code: CodeframeEntry) => {
    setEditingCode(code);
    setEditAction('split');
    setSplitNewCodes([
      { label: '', definition: '' },
      { label: '', definition: '' }
    ]);
  };

  const confirmSplit = () => {
    if (!editingCode) return;
    
    const validNewCodes = splitNewCodes.filter(c => c.label && c.definition);
    if (validNewCodes.length < 2) {
      toast({
        variant: "destructive",
        title: "Invalid split",
        description: "Please provide at least 2 new codes with labels and definitions"
      });
      return;
    }

    // Find the index of the code being split
    const codeIndex = localCodeframe.findIndex(c => c.code === editingCode.code);
    
    // Create new codes
    const newCodes: CodeframeEntry[] = validNewCodes.map((newCode, index) => ({
      code: `${editingCode.code}_${index + 1}`,
      numeric: editingCode.numeric ? `${editingCode.numeric}.${index + 1}` : String(index + 1),
      label: newCode.label,
      definition: newCode.definition,
      examples: index === 0 ? editingCode.examples : [],
      count: Math.floor((editingCode.count || 0) / validNewCodes.length),
      percentage: editingCode.percentage ? editingCode.percentage / validNewCodes.length : 0
    }));

    // Replace the original code with new codes
    const newCodeframe = [
      ...localCodeframe.slice(0, codeIndex),
      ...newCodes,
      ...localCodeframe.slice(codeIndex + 1)
    ];

    setLocalCodeframe(newCodeframe);
    onCodeframeChange(newCodeframe);
    
    // Reset state
    setEditAction(null);
    setEditingCode(null);
    
    toast({
      title: "Code split",
      description: `${editingCode.label} split into ${validNewCodes.length} new codes`
    });
  };

  const handleRename = (code: CodeframeEntry) => {
    setEditingCode(code);
    setEditAction('rename');
  };

  const confirmRename = (newLabel: string, newDefinition: string) => {
    if (!editingCode) return;

    const newCodeframe = localCodeframe.map(c => 
      c.code === editingCode.code 
        ? { ...c, label: newLabel, definition: newDefinition }
        : c
    );

    setLocalCodeframe(newCodeframe);
    onCodeframeChange(newCodeframe);
    
    setEditAction(null);
    setEditingCode(null);
    
    toast({
      title: "Code renamed",
      description: `Updated to: ${newLabel}`
    });
  };

  const handleDelete = (code: CodeframeEntry) => {
    const newCodeframe = localCodeframe.filter(c => c.code !== code.code);
    setLocalCodeframe(newCodeframe);
    onCodeframeChange(newCodeframe);
    
    toast({
      title: "Code deleted",
      description: `${code.label} has been removed`
    });
  };

  const handleAdd = () => {
    setEditAction('add');
    setNewCodeData({ label: '', definition: '', numeric: '' });
  };

  const confirmAdd = () => {
    if (!newCodeData.label || !newCodeData.definition) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both label and definition"
      });
      return;
    }

    const newCode: CodeframeEntry = {
      code: `NEW_${Date.now()}`,
      numeric: newCodeData.numeric || String(localCodeframe.length + 1),
      label: newCodeData.label,
      definition: newCodeData.definition,
      examples: [],
      count: 0,
      percentage: 0
    };

    const newCodeframe = [...localCodeframe, newCode];
    setLocalCodeframe(newCodeframe);
    onCodeframeChange(newCodeframe);
    
    setEditAction(null);
    
    toast({
      title: "Code added",
      description: `${newCode.label} has been added to the codeframe`
    });
  };

  const moveCode = (index: number, direction: 'up' | 'down') => {
    const newCodeframe = [...localCodeframe];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newCodeframe.length) return;
    
    [newCodeframe[index], newCodeframe[newIndex]] = [newCodeframe[newIndex], newCodeframe[index]];
    
    setLocalCodeframe(newCodeframe);
    onCodeframeChange(newCodeframe);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Codeframe Editor</span>
          {isEditable && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAdd}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Code
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMerge}
                disabled={selectedCodes.length < 2}
              >
                <Merge className="h-4 w-4 mr-1" />
                Merge Selected
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {localCodeframe.map((code, index) => (
            <div
              key={code.code}
              className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              {isEditable && (
                <Checkbox
                  checked={selectedCodes.includes(code.code)}
                  onCheckedChange={() => handleCodeSelect(code.code)}
                />
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{code.numeric || code.code}</Badge>
                  <span className="font-medium">{code.label}</span>
                  {code.count && code.count > 0 && (
                    <Badge variant="outline" className="ml-auto">
                      {code.count} ({code.percentage?.toFixed(1)}%)
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{code.definition}</p>
                {code.examples && code.examples.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Examples: {code.examples.slice(0, 2).join(', ')}
                    {code.examples.length > 2 && ` +${code.examples.length - 2} more`}
                  </p>
                )}
              </div>
              
              {isEditable && (
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => moveCode(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => moveCode(index, 'down')}
                    disabled={index === localCodeframe.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRename(code)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSplit(code)}
                  >
                    <Split className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(code)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Merge Dialog */}
        <Dialog open={editAction === 'merge'} onOpenChange={() => setEditAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Merge Codes</DialogTitle>
              <DialogDescription>
                Select which code to merge the selected codes into
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Target Code</Label>
                <Select value={mergeTargetCode} onValueChange={setMergeTargetCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target code" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCodes.map(code => {
                      const codeEntry = localCodeframe.find(c => c.code === code);
                      return (
                        <SelectItem key={code} value={code}>
                          {codeEntry?.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                The following codes will be merged into the target:
                <ul className="list-disc list-inside mt-2">
                  {selectedCodes
                    .filter(c => c !== mergeTargetCode)
                    .map(code => {
                      const codeEntry = localCodeframe.find(c => c.code === code);
                      return <li key={code}>{codeEntry?.label}</li>;
                    })}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAction(null)}>
                Cancel
              </Button>
              <Button onClick={confirmMerge} disabled={!mergeTargetCode}>
                Merge Codes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Split Dialog */}
        <Dialog open={editAction === 'split'} onOpenChange={() => setEditAction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Split Code: {editingCode?.label}</DialogTitle>
              <DialogDescription>
                Create new codes from the existing code
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {splitNewCodes.map((newCode, index) => (
                <div key={index} className="space-y-2 p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <Label>New Code {index + 1}</Label>
                    {index > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setSplitNewCodes(splitNewCodes.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Label"
                    value={newCode.label}
                    onChange={(e) => {
                      const updated = [...splitNewCodes];
                      updated[index].label = e.target.value;
                      setSplitNewCodes(updated);
                    }}
                  />
                  <Input
                    placeholder="Definition"
                    value={newCode.definition}
                    onChange={(e) => {
                      const updated = [...splitNewCodes];
                      updated[index].definition = e.target.value;
                      setSplitNewCodes(updated);
                    }}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setSplitNewCodes([...splitNewCodes, { label: '', definition: '' }])}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Code
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAction(null)}>
                Cancel
              </Button>
              <Button onClick={confirmSplit}>
                Split Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={editAction === 'rename'} onOpenChange={() => setEditAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Code</DialogTitle>
              <DialogDescription>
                Update the label and definition for {editingCode?.label}
              </DialogDescription>
            </DialogHeader>
            {editingCode && (
              <RenameForm
                code={editingCode}
                onConfirm={confirmRename}
                onCancel={() => setEditAction(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Add Dialog */}
        <Dialog open={editAction === 'add'} onOpenChange={() => setEditAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Code</DialogTitle>
              <DialogDescription>
                Create a new code for the codeframe
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Numeric Code</Label>
                <Input
                  placeholder="e.g., 11 or 2.3"
                  value={newCodeData.numeric}
                  onChange={(e) => setNewCodeData({ ...newCodeData, numeric: e.target.value })}
                />
              </div>
              <div>
                <Label>Label</Label>
                <Input
                  placeholder="Short descriptive name"
                  value={newCodeData.label}
                  onChange={(e) => setNewCodeData({ ...newCodeData, label: e.target.value })}
                />
              </div>
              <div>
                <Label>Definition</Label>
                <Input
                  placeholder="Full description of what this code represents"
                  value={newCodeData.definition}
                  onChange={(e) => setNewCodeData({ ...newCodeData, definition: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditAction(null)}>
                Cancel
              </Button>
              <Button onClick={confirmAdd}>
                Add Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

// Rename form component
const RenameForm: React.FC<{
  code: CodeframeEntry;
  onConfirm: (label: string, definition: string) => void;
  onCancel: () => void;
}> = ({ code, onConfirm, onCancel }) => {
  const [label, setLabel] = useState(code.label);
  const [definition, setDefinition] = useState(code.definition);

  return (
    <>
      <div className="space-y-4">
        <div>
          <Label>Label</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Code label"
          />
        </div>
        <div>
          <Label>Definition</Label>
          <Input
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="Code definition"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onConfirm(label, definition)}>
          Update
        </Button>
      </DialogFooter>
    </>
  );
};

export default CodeframeEditor;