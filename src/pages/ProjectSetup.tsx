import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CleanLayout from '../components/CleanLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from '../components/ui/use-toast';

interface ProjectMetadata {
  clientName: string;
  projectType: string;
  waveNumber: string;
  notes: string;
}

const ProjectSetup: React.FC = () => {
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState<ProjectMetadata>({
    clientName: '',
    projectType: '',
    waveNumber: '',
    notes: ''
  });

  const handleInputChange = (field: keyof ProjectMetadata, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (!metadata.clientName || !metadata.projectType) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in the client name and project type to continue.",
      });
      return;
    }

    // Create project ID and save metadata
    const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const projectData = {
      id: projectId,
      ...metadata,
      dateCreated: new Date(),
      lastModified: new Date(),
      status: 'draft' as const
    };

    // Save to projects list
    const existingProjects = JSON.parse(localStorage.getItem('qualicoding-projects') || '[]');
    existingProjects.push(projectData);
    localStorage.setItem('qualicoding-projects', JSON.stringify(existingProjects));

    // Set as active project
    localStorage.setItem('qualicoding-active-project', projectId);
    localStorage.setItem(`qualicoding-project-${projectId}`, JSON.stringify(projectData));

    toast({
      title: "Project created",
      description: `"${metadata.clientName}" project has been created successfully.`,
    });

    navigate(`/project/${projectId}/upload`);
  };

  const isFormValid = metadata.clientName.trim() && metadata.projectType.trim();

  return (
    <CleanLayout title="New Project" subtitle="Step 1 of 4: Project Information">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={metadata.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                placeholder="e.g., AcmeCorp"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type *</Label>
              <Select value={metadata.projectType} onValueChange={(value) => handleInputChange('projectType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Segmentation">Segmentation</SelectItem>
                  <SelectItem value="Tracking">Tracking</SelectItem>
                  <SelectItem value="Ad Hoc">Ad Hoc</SelectItem>
                  <SelectItem value="Brand Health">Brand Health</SelectItem>
                  <SelectItem value="Concept Testing">Concept Testing</SelectItem>
                  <SelectItem value="Usage & Attitudes">Usage & Attitudes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waveNumber">Wave Number (optional)</Label>
              <Input
                id="waveNumber"
                value={metadata.waveNumber}
                onChange={(e) => handleInputChange('waveNumber', e.target.value)}
                placeholder="e.g., W2, Wave 3, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={metadata.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional project notes or context..."
                rows={3}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleNext} disabled={!isFormValid}>
                Next: Upload Data
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CleanLayout>
  );
};

export default ProjectSetup;