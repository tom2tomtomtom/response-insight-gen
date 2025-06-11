import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CleanLayout from '../components/CleanLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, ArrowRight, Brain, CheckCircle, Clock, AlertCircle, Users, MessageSquare, Tag } from 'lucide-react';
import { toast } from '../components/ui/use-toast';

interface QuestionGroup {
  id: string;
  name: string;
  questionType: 'unaided-awareness' | 'brand-descriptions' | 'miscellaneous';
  columns: number[];
}

interface CodeframeEntry {
  code: string;
  label: string;
  definition: string;
  examples: string[];
}

interface GeneratedCodeframe {
  groupId: string;
  groupName: string;
  questionType: string;
  codeframe: CodeframeEntry[];
  sampleSize: number;
  generatedAt: Date;
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
}

const QUESTION_TYPE_PROMPTS = {
  'unaided-awareness': {
    systemPrompt: `You are a market research coding specialist. Respondents have listed brands they recall when asked for unaided awareness. Generate a codeframe where each code ID corresponds to a unique brand mentioned.

For each code, provide:
• A unique code ID (e.g., C001, C002, …)
• The brand name as the label
• A clear definition
• Sample mentions from the responses

Return valid JSON in this format:
{
  "codeframe": [
    {
      "code": "C001",
      "label": "BrandName",
      "definition": "Mentions of BrandName in any form",
      "examples": ["exact mentions from responses"]
    }
  ]
}`,
    userPrompt: (responses: string[], sampleSize: number) => 
      `Here are ${sampleSize} sample responses from unaided brand awareness questions (each line lists one or more brands mentioned by respondents):

${responses.join('\n')}

Generate a codeframe for these brand mentions.`
  },
  
  'brand-descriptions': {
    systemPrompt: `You are a market research coding specialist. Respondents have described a brand's attributes. Generate a codeframe where each code corresponds to a unique descriptive theme (e.g., "Customer Service," "Value," "Innovation").

For each code, provide:
• A unique code ID (e.g., C001, C002, …)
• A concise label (under 3 words, title case)
• A clear definition of what this theme encompasses
• Sample responses illustrating this theme

Return valid JSON in this format:
{
  "codeframe": [
    {
      "code": "C001",
      "label": "Customer Service",
      "definition": "Comments about staff helpfulness, service quality, and customer support",
      "examples": ["exact quotes from responses"]
    }
  ]
}`,
    userPrompt: (responses: string[], sampleSize: number) => 
      `Here are ${sampleSize} sample responses where respondents described brand attributes:

${responses.join('\n')}

Generate a comprehensive codeframe for these brand descriptions.`
  },
  
  'miscellaneous': {
    systemPrompt: `You are a market research coding specialist. Generate a comprehensive codeframe for miscellaneous open-ended responses across varied topics.

For each code, provide:
• A unique code ID (e.g., C001, C002, …)
• A concise label (under 3 words, title case)
• A clear definition of what this theme encompasses
• Sample responses illustrating this theme

Return valid JSON in this format:
{
  "codeframe": [
    {
      "code": "C001",
      "label": "Theme Label",
      "definition": "Clear description of what this code captures",
      "examples": ["exact quotes from responses"]
    }
  ]
}`,
    userPrompt: (responses: string[], sampleSize: number) => 
      `Here are ${sampleSize} sample responses from various open-ended questions:

${responses.join('\n')}

Generate a comprehensive codeframe that captures the variety of topics in these responses.`
  }
};

const ProjectGenerate: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [groups, setGroups] = useState<QuestionGroup[]>([]);
  const [codeframes, setCodeframes] = useState<GeneratedCodeframe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGenerating, setCurrentGenerating] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    if (!projectId) return;

    // Load groups
    const groupData = localStorage.getItem(`qualicoding-project-${projectId}-groups`);
    if (groupData) {
      const parsedGroups = JSON.parse(groupData);
      setGroups(parsedGroups);
      
      // Initialize codeframes state
      const initialCodeframes = parsedGroups.map((group: QuestionGroup) => ({
        groupId: group.id,
        groupName: group.name,
        questionType: group.questionType,
        codeframe: [],
        sampleSize: 0,
        generatedAt: new Date(),
        status: 'pending' as const
      }));
      setCodeframes(initialCodeframes);
    }

    // Get API key from localStorage or prompt user
    const savedApiKey = localStorage.getItem('qualicoding-openai-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, [projectId]);

  const sampleResponses = (responses: string[], percentage: number = 30): string[] => {
    const sampleSize = Math.max(20, Math.round(responses.length * (percentage / 100)));
    const shuffled = [...responses].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  };

  const generateCodeframeForGroup = async (group: QuestionGroup): Promise<CodeframeEntry[]> => {
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get raw data
    const fileData = localStorage.getItem(`qualicoding-project-${projectId}-file`);
    if (!fileData) {
      throw new Error('File data not found');
    }

    const parsedFile = JSON.parse(fileData);
    const rawData = parsedFile.rawData;

    // Extract responses for this group's columns
    const responses: string[] = [];
    
    // Skip header row (index 0)
    for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex];
      
      // Concatenate responses from all columns in this group
      const groupResponses = group.columns
        .map(colIndex => row[colIndex])
        .filter(val => val && String(val).trim())
        .map(val => String(val).trim());
      
      if (groupResponses.length > 0) {
        responses.push(groupResponses.join(' ∥ '));
      }
    }

    if (responses.length === 0) {
      throw new Error('No responses found for this group');
    }

    // Sample 30% of responses
    const sampledResponses = sampleResponses(responses, 30);
    
    // Get prompt configuration for question type
    const promptConfig = QUESTION_TYPE_PROMPTS[group.questionType];
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: promptConfig.systemPrompt
          },
          {
            role: 'user', 
            content: promptConfig.userPrompt(sampledResponses, sampledResponses.length)
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return result.codeframe || [];
  };

  const handleGenerateAll = async () => {
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Required",
        description: "Please configure your OpenAI API key to generate codeframes.",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      for (const group of groups) {
        setCurrentGenerating(group.id);
        
        // Update status to generating
        setCodeframes(prev => prev.map(cf => 
          cf.groupId === group.id 
            ? { ...cf, status: 'generating' as const }
            : cf
        ));

        try {
          const codeframe = await generateCodeframeForGroup(group);
          
          // Update with results
          setCodeframes(prev => prev.map(cf => 
            cf.groupId === group.id 
              ? { 
                  ...cf, 
                  codeframe, 
                  status: 'complete' as const, 
                  generatedAt: new Date(),
                  sampleSize: Math.max(20, Math.round(1000 * 0.3)) // Placeholder
                }
              : cf
          ));

          toast({
            title: "Codeframe generated",
            description: `"${group.name}" codeframe completed with ${codeframe.length} codes.`,
          });
          
        } catch (error) {
          console.error(`Error generating codeframe for ${group.name}:`, error);
          
          setCodeframes(prev => prev.map(cf => 
            cf.groupId === group.id 
              ? { 
                  ...cf, 
                  status: 'error' as const, 
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              : cf
          ));
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Save all codeframes
      const completedCodeframes = codeframes.filter(cf => cf.status === 'complete');
      localStorage.setItem(`qualicoding-project-${projectId}-codeframes`, JSON.stringify(completedCodeframes));

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsGenerating(false);
      setCurrentGenerating(null);
    }
  };

  const handleNext = () => {
    const completedCount = codeframes.filter(cf => cf.status === 'complete').length;
    
    if (completedCount === 0) {
      toast({
        variant: "destructive",
        title: "No codeframes generated",
        description: "Please generate at least one codeframe to continue.",
      });
      return;
    }

    navigate(`/project/${projectId}/results`);
  };

  const handleSetApiKey = () => {
    const key = prompt('Enter your OpenAI API key:');
    if (key) {
      setApiKey(key);
      localStorage.setItem('qualicoding-openai-key', key);
      toast({
        title: "API key saved",
        description: "OpenAI API key has been configured.",
      });
    }
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'unaided-awareness': return Users;
      case 'brand-descriptions': return MessageSquare;
      default: return Tag;
    }
  };

  const completedCount = codeframes.filter(cf => cf.status === 'complete').length;
  const totalCodes = codeframes.reduce((sum, cf) => sum + cf.codeframe.length, 0);

  return (
    <CleanLayout title="Generate Codeframes" subtitle="Step 5 of 6: AI Codeframe Generation">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(`/project/${projectId}/grouping`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Question Grouping
          </Button>
        </div>

        <div className="space-y-6">
          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">OpenAI API Key</p>
                  <p className="text-sm text-slate-600">
                    {apiKey ? 'API key configured' : 'No API key configured'}
                  </p>
                </div>
                <Button variant="outline" onClick={handleSetApiKey}>
                  {apiKey ? 'Update Key' : 'Set API Key'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generation Progress */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Codeframe Generation</CardTitle>
                <Button 
                  onClick={handleGenerateAll}
                  disabled={!apiKey || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate All Codeframes
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                AI will analyze a 30% random sample of responses for each group and generate optimized codeframes.
              </p>

              <div className="space-y-4">
                {groups.map((group) => {
                  const codeframe = codeframes.find(cf => cf.groupId === group.id);
                  const isCurrentlyGenerating = currentGenerating === group.id;
                  const Icon = getQuestionTypeIcon(group.questionType);
                  
                  return (
                    <div key={group.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-600" />
                          <span className="font-medium">{group.name}</span>
                          <Badge variant="outline">{group.questionType}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {codeframe?.status === 'complete' && (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {codeframe.codeframe.length} codes
                            </Badge>
                          )}
                          {codeframe?.status === 'generating' && (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                              Generating...
                            </Badge>
                          )}
                          {codeframe?.status === 'error' && (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                        </div>
                      </div>

                      {isCurrentlyGenerating && (
                        <div className="space-y-2">
                          <Progress value={undefined} />
                          <p className="text-sm text-slate-600">
                            Analyzing sample responses and generating codeframe...
                          </p>
                        </div>
                      )}

                      {codeframe?.status === 'complete' && codeframe.codeframe.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-slate-600 mb-2">Generated codes:</p>
                          <div className="flex flex-wrap gap-1">
                            {codeframe.codeframe.slice(0, 5).map((code) => (
                              <Badge key={code.code} variant="secondary" className="text-xs">
                                {code.label}
                              </Badge>
                            ))}
                            {codeframe.codeframe.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{codeframe.codeframe.length - 5} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {codeframe?.status === 'error' && (
                        <Alert className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {codeframe.error || 'An error occurred during generation'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {completedCount > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Generated {completedCount} of {groups.length} codeframes with {totalCodes} total codes.
                {completedCount < groups.length && ' Some groups failed - you can continue with completed codeframes or retry generation.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleNext} 
              disabled={completedCount === 0}
            >
              Next: Review & Export
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </CleanLayout>
  );
};

export default ProjectGenerate;