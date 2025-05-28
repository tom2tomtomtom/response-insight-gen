
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Building, Target, Calendar, FileText } from 'lucide-react';
import { useProcessing } from '../contexts/ProcessingContext';

const StudySummaryPanel: React.FC = () => {
  const { projectContext, uploadedFile } = useProcessing();

  if (!projectContext || !uploadedFile) {
    return null;
  }

  return (
    <Card className="w-full mb-6 bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <FileText className="h-5 w-5" />
          Study Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="font-medium">{projectContext.clientName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="font-medium">{projectContext.industry}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Study Type</p>
              <Badge variant={projectContext.studyType === 'tracking' ? 'default' : 'secondary'}>
                {projectContext.studyType === 'tracking' ? 'Tracking' : 'New Study'}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">File</p>
              <p className="font-medium text-sm truncate">{uploadedFile.filename}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Study Objective</p>
          <p className="text-sm">{projectContext.studyObjective}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudySummaryPanel;
