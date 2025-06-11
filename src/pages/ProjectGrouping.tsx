import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CleanLayout from '../components/CleanLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, ArrowRight, Plus, Trash2, Users, MessageSquare, Tag, AlertCircle } from 'lucide-react';
import { toast } from '../components/ui/use-toast';

interface ColumnInfo {
  index: number;
  name: string;
  type: string;
  examples: string[];
  nonEmptyCount: number;
}

interface QuestionGroup {
  id: string;
  name: string;
  questionType: 'unaided-awareness' | 'brand-descriptions' | 'miscellaneous';
  columns: number[];
  useExistingCodeframe?: boolean;
  existingCodeframeName?: string;
}

const QUESTION_TYPES = [
  {
    value: 'unaided-awareness',
    label: 'Unaided Awareness',
    description: 'Respondents list brands they recall without prompts',
    icon: Users,
    examples: ['Which brands come to mind?', 'What companies can you name?']
  },
  {
    value: 'brand-descriptions',
    label: 'Brand Descriptions', 
    description: 'Respondents describe brand attributes or perceptions',
    icon: MessageSquare,
    examples: ['How would you describe Brand X?', 'What words come to mind for this brand?']
  },
  {
    value: 'miscellaneous',
    label: 'Miscellaneous Open-Ends',
    description: 'Any other open-ended questions',
    icon: Tag,
    examples: ['What did you like?', 'Any additional comments?']
  }
] as const;

const ProjectGrouping: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);
  const [availableColumns, setAvailableColumns] = useState<number[]>([]);
  const [groups, setGroups] = useState<QuestionGroup[]>([]);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    questionType: '' as QuestionGroup['questionType'] | '',
    columns: [] as number[]
  });

  useEffect(() => {
    if (!projectId) return;

    // Load file data and column selection
    const fileData = localStorage.getItem(`qualicoding-project-${projectId}-file`);
    const columnData = localStorage.getItem(`qualicoding-project-${projectId}-columns`);
    
    if (fileData && columnData) {
      const parsedFile = JSON.parse(fileData);
      const parsedColumns = JSON.parse(columnData);
      
      setColumns(parsedFile.columns || []);
      setSelectedColumns(parsedColumns.selectedColumns || []);
      setAvailableColumns(parsedColumns.selectedColumns || []);
    }

    // Load existing groups if any
    const groupData = localStorage.getItem(`qualicoding-project-${projectId}-groups`);
    if (groupData) {
      const parsedGroups = JSON.parse(groupData);
      setGroups(parsedGroups);
      
      // Update available columns (remove already grouped columns)
      const usedColumns = parsedGroups.flatMap((g: QuestionGroup) => g.columns);
      setAvailableColumns(prev => prev.filter(col => !usedColumns.includes(col)));
    }
  }, [projectId]);

  const getColumnName = (index: number) => {
    const column = columns.find(col => col.index === index);
    return column?.name || `Column ${index + 1}`;
  };

  const getQuestionTypeInfo = (type: QuestionGroup['questionType']) => {
    return QUESTION_TYPES.find(qt => qt.value === type);
  };

  const handleCreateGroup = () => {
    if (!newGroup.name || !newGroup.questionType || newGroup.columns.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields and select at least one column.",
      });
      return;
    }

    const group: QuestionGroup = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: newGroup.name,
      questionType: newGroup.questionType,
      columns: newGroup.columns
    };

    setGroups(prev => [...prev, group]);
    setAvailableColumns(prev => prev.filter(col => !newGroup.columns.includes(col)));
    
    // Reset form
    setNewGroup({ name: '', questionType: '', columns: [] });
    setShowNewGroupForm(false);

    toast({
      title: "Group created",
      description: `"${group.name}" group created with ${group.columns.length} columns.`,
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Return columns to available pool
    setAvailableColumns(prev => [...prev, ...group.columns].sort());
    setGroups(prev => prev.filter(g => g.id !== groupId));

    toast({
      title: "Group deleted",
      description: `"${group.name}" group has been removed.`,
    });
  };

  const handleColumnToggle = (columnIndex: number) => {
    setNewGroup(prev => ({
      ...prev,
      columns: prev.columns.includes(columnIndex)
        ? prev.columns.filter(col => col !== columnIndex)
        : [...prev.columns, columnIndex]
    }));
  };

  const handleNext = () => {
    if (groups.length === 0) {
      toast({
        variant: "destructive",
        title: "No groups created",
        description: "Please create at least one question group to continue.",
      });
      return;
    }

    if (availableColumns.length > 0) {
      toast({
        variant: "destructive", 
        title: "Ungrouped columns",
        description: "All selected columns must be assigned to a group before proceeding.",
      });
      return;
    }

    // Save groups
    localStorage.setItem(`qualicoding-project-${projectId}-groups`, JSON.stringify(groups));

    toast({
      title: "Groups configured",
      description: `${groups.length} question groups ready for AI analysis.`,
    });

    navigate(`/project/${projectId}/generate`);
  };

  return (
    <CleanLayout title="Question Grouping" subtitle="Step 4 of 6: Group Questions by Type">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(`/project/${projectId}/columns`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Column Selection
          </Button>
        </div>

        <div className="space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Group Your Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Group related columns together and assign a question type. Each group will generate its own codeframe 
                optimized for that specific type of question.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {QUESTION_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div key={type.value} className="p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-slate-600" />
                        <span className="font-medium text-slate-900">{type.label}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{type.description}</p>
                      <div className="text-xs text-slate-500">
                        Examples: {type.examples.join(', ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Available Columns */}
          {availableColumns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available Columns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableColumns.map(colIndex => (
                    <div key={colIndex} className="text-sm p-2 bg-slate-50 rounded border">
                      {getColumnName(colIndex)}
                    </div>
                  ))}
                </div>
                
                {!showNewGroupForm && (
                  <Button 
                    onClick={() => setShowNewGroupForm(true)} 
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Group
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* New Group Form */}
          {showNewGroupForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Brand Perceptions, Awareness Questions"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionType">Question Type</Label>
                  <Select value={newGroup.questionType} onValueChange={(value: QuestionGroup['questionType']) => 
                    setNewGroup(prev => ({ ...prev, questionType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Columns for This Group</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {availableColumns.map(colIndex => {
                      const column = columns.find(col => col.index === colIndex);
                      return (
                        <div 
                          key={colIndex}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            newGroup.columns.includes(colIndex)
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                          onClick={() => handleColumnToggle(colIndex)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{getColumnName(colIndex)}</span>
                            <Badge variant="secondary">
                              {column?.nonEmptyCount} responses
                            </Badge>
                          </div>
                          {column?.examples && (
                            <div className="text-sm text-slate-600 mt-1">
                              Examples: {column.examples.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateGroup}>
                    Create Group
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowNewGroupForm(false);
                      setNewGroup({ name: '', questionType: '', columns: [] });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Groups */}
          {groups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Created Groups ({groups.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {groups.map((group) => {
                  const typeInfo = getQuestionTypeInfo(group.questionType);
                  const Icon = typeInfo?.icon || Tag;
                  
                  return (
                    <div key={group.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-4 w-4 text-slate-600" />
                            <span className="font-medium text-slate-900">{group.name}</span>
                            <Badge variant="outline">{typeInfo?.label}</Badge>
                          </div>
                          <p className="text-sm text-slate-600">{typeInfo?.description}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Columns:</span>
                        <div className="flex flex-wrap gap-2">
                          {group.columns.map(colIndex => (
                            <Badge key={colIndex} variant="secondary">
                              {getColumnName(colIndex)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Status and Next */}
          <div className="space-y-4">
            {availableColumns.length > 0 && groups.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have {availableColumns.length} ungrouped columns. All columns must be assigned to a group to continue.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={handleNext} 
                disabled={groups.length === 0 || availableColumns.length > 0}
              >
                Next: Generate Codeframes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </CleanLayout>
  );
};

export default ProjectGrouping;