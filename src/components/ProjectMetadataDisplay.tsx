import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Building2, Target, Briefcase, Calendar, Hash } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';
import { format } from 'date-fns';

const ProjectMetadataDisplay: React.FC = () => {
  const { projectContext, trackingConfig } = useProcessing();
  
  // Check if we have project metadata from localStorage or context
  const savedProjectId = localStorage.getItem('response-insight-active-project');
  const projectMetadata = React.useMemo(() => {
    if (projectContext) {
      return projectContext;
    }
    
    // Try to get from saved project
    if (savedProjectId) {
      const projects = localStorage.getItem('response-insight-projects');
      if (projects) {
        const projectList = JSON.parse(projects);
        const activeProject = projectList.find((p: any) => p.id === savedProjectId);
        if (activeProject) {
          return {
            industry: activeProject.industry,
            clientName: activeProject.client,
            studyObjective: activeProject.objective,
            studyType: activeProject.studyType
          };
        }
      }
    }
    
    return null;
  }, [projectContext, savedProjectId]);
  
  if (!projectMetadata) {
    return null;
  }
  
  return (
    <Card className="mb-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-primary">Project Information</h3>
          {trackingConfig?.isPriorCodeframe && (
            <Badge variant="secondary" className="text-xs">
              <Hash className="h-3 w-3 mr-1" />
              Wave {trackingConfig.waveNumber}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Industry */}
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-primary/10 rounded">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="text-sm font-medium truncate">{projectMetadata.industry || 'Not specified'}</p>
            </div>
          </div>
          
          {/* Client */}
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-primary/10 rounded">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-medium truncate">{projectMetadata.clientName || 'Not specified'}</p>
            </div>
          </div>
          
          {/* Study Type */}
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-primary/10 rounded">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Study Type</p>
              <p className="text-sm font-medium capitalize">{projectMetadata.studyType || 'ad-hoc'}</p>
            </div>
          </div>
          
          {/* Objective */}
          <div className="flex items-start gap-2">
            <div className="p-1.5 bg-primary/10 rounded">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Objective</p>
              <p className="text-sm font-medium truncate" title={projectMetadata.studyObjective}>
                {projectMetadata.studyObjective || 'Not specified'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Session Info */}
        <div className="mt-3 pt-3 border-t border-primary/10">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Session started: {format(new Date(), 'MMM d, h:mm a')}</span>
            {savedProjectId && (
              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                ID: {savedProjectId.slice(-8)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectMetadataDisplay;