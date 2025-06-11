import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CleanLayout from '../components/CleanLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Download, FileSpreadsheet, FileText, CheckCircle } from 'lucide-react';
import { toast } from '../components/ui/use-toast';
import * as XLSX from 'xlsx';

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
  status: string;
}

interface ProjectData {
  clientName: string;
  projectType: string;
  waveNumber: string;
}

const ProjectResults: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [codeframes, setCodeframes] = useState<GeneratedCodeframe[]>([]);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    // Load project data
    const projectInfo = localStorage.getItem(`qualicoding-project-${projectId}`);
    if (projectInfo) {
      setProjectData(JSON.parse(projectInfo));
    }

    // Load codeframes
    const codeframeData = localStorage.getItem(`qualicoding-project-${projectId}-codeframes`);
    if (codeframeData) {
      const parsedCodeframes = JSON.parse(codeframeData);
      setCodeframes(parsedCodeframes);
    }
  }, [projectId]);

  const generateExcelExport = async () => {
    if (!projectData || codeframes.length === 0) return;

    setIsExporting(true);

    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Codeframe
      const codeframeRows = [
        ['Code_ID', 'Label', 'Definition', 'Examples', 'Question_Group', 'Group_Columns', 'Question_Type', 'Date_Modified']
      ];

      codeframes.forEach(group => {
        group.codeframe.forEach(code => {
          codeframeRows.push([
            code.code,
            code.label,
            code.definition,
            code.examples.join('; '),
            group.groupName,
            'Multiple columns', // Placeholder - would need actual column info
            group.questionType,
            new Date(group.generatedAt).toISOString().split('T')[0]
          ]);
        });
      });

      const codeframeSheet = XLSX.utils.aoa_to_sheet(codeframeRows);
      XLSX.utils.book_append_sheet(workbook, codeframeSheet, 'Codeframe');

      // Sheet 2: Coded_Responses (placeholder - would need actual semantic matching)
      const responsesRows = [
        ['Respondent_ID', ...codeframes.flatMap(group => 
          group.codeframe.map(code => code.code)
        )]
      ];

      // Add sample rows (in real implementation, this would be actual coded data)
      for (let i = 1; i <= 10; i++) {
        const row = [`R${i.toString().padStart(3, '0')}`];
        // Add binary coding (0 or 1) for each code
        codeframes.forEach(group => {
          group.codeframe.forEach(() => {
            row.push(Math.random() > 0.7 ? '1' : '0'); // Random for demo
          });
        });
        responsesRows.push(row);
      }

      const responsesSheet = XLSX.utils.aoa_to_sheet(responsesRows);
      XLSX.utils.book_append_sheet(workbook, responsesSheet, 'Coded_Responses');

      // Generate filename
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `${projectData.clientName}_${projectData.projectType}_${projectData.waveNumber || 'W1'}_${date}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export complete",
        description: `${filename} has been downloaded to your computer.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "An error occurred while generating the Excel file.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateCodeframeCsv = () => {
    if (codeframes.length === 0) return;

    const headers = ['Code_ID', 'Label', 'Definition', 'Examples', 'Question_Group', 'Question_Type'];
    const rows = [headers.join(',')];

    codeframes.forEach(group => {
      group.codeframe.forEach(code => {
        const row = [
          code.code,
          `"${code.label}"`,
          `"${code.definition}"`,
          `"${code.examples.join('; ')}"`,
          `"${group.groupName}"`,
          group.questionType
        ];
        rows.push(row.join(','));
      });
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectData?.clientName || 'Project'}_Codeframe.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Codeframe exported",
      description: "Codeframe CSV has been downloaded.",
    });
  };

  const handleFinishProject = () => {
    // Update project status
    if (projectData) {
      const updatedProject = {
        ...projectData,
        status: 'complete',
        lastModified: new Date()
      };
      localStorage.setItem(`qualicoding-project-${projectId}`, JSON.stringify(updatedProject));
    }

    toast({
      title: "Project completed",
      description: "Your qualitative coding project has been finalized.",
    });

    navigate('/dashboard');
  };

  const totalCodes = codeframes.reduce((sum, group) => sum + group.codeframe.length, 0);

  return (
    <CleanLayout title="Project Results" subtitle="Step 6 of 6: Review & Export">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(`/project/${projectId}/generate`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Generation
          </Button>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Project Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-slate-900">{codeframes.length}</div>
                  <div className="text-sm text-slate-600">Question Groups</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{totalCodes}</div>
                  <div className="text-sm text-slate-600">Total Codes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{projectData?.clientName}</div>
                  <div className="text-sm text-slate-600">Client</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{projectData?.projectType}</div>
                  <div className="text-sm text-slate-600">Project Type</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>Export Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={generateExcelExport}
                  disabled={isExporting}
                  size="lg"
                  className="h-auto py-4"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Complete Excel Export</div>
                      <div className="text-xs opacity-75">Codeframe + Coded Responses</div>
                    </div>
                  </div>
                </Button>

                <Button 
                  onClick={generateCodeframeCsv}
                  variant="outline"
                  size="lg"
                  className="h-auto py-4"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-6 w-6" />
                    <div>
                      <div className="font-medium">Codeframe Only (CSV)</div>
                      <div className="text-xs opacity-75">Codes, labels & definitions</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Codeframe Review */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Codeframes</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={codeframes[0]?.groupId} className="w-full">
                <TabsList>
                  {codeframes.map((group) => (
                    <TabsTrigger key={group.groupId} value={group.groupId}>
                      {group.groupName}
                      <Badge variant="secondary" className="ml-2">
                        {group.codeframe.length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {codeframes.map((group) => (
                  <TabsContent key={group.groupId} value={group.groupId}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{group.questionType}</Badge>
                        <span className="text-sm text-slate-600">
                          {group.codeframe.length} codes generated
                        </span>
                      </div>

                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Label</TableHead>
                            <TableHead>Definition</TableHead>
                            <TableHead>Examples</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.codeframe.map((code) => (
                            <TableRow key={code.code}>
                              <TableCell className="font-mono text-sm">{code.code}</TableCell>
                              <TableCell className="font-medium">{code.label}</TableCell>
                              <TableCell className="text-sm">{code.definition}</TableCell>
                              <TableCell className="text-sm">
                                {code.examples.slice(0, 2).join('; ')}
                                {code.examples.length > 2 && '...'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Finish */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Save as Draft
            </Button>
            <Button onClick={handleFinishProject}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finish Project
            </Button>
          </div>
        </div>
      </div>
    </CleanLayout>
  );
};

export default ProjectResults;