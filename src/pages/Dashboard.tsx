import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Clock, 
  FileText, 
  Download, 
  RefreshCw,
  Trash2,
  ArrowRight,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '../components/ui/use-toast';

interface ProjectHistoryItem {
  id: string;
  name: string;
  createdAt: Date;
  industry: string;
  clientName: string;
  columnsProcessed: number;
  codeframesGenerated: number;
  status: 'complete' | 'in_progress' | 'draft';
}

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<ProjectHistoryItem[]>([]);
  const [savedCodeframes, setSavedCodeframes] = useState<any[]>([]);

  useEffect(() => {
    // Load project history from localStorage
    loadProjectHistory();
    loadSavedCodeframes();
  }, []);

  const loadProjectHistory = () => {
    try {
      // This would normally load from a backend, but for now use localStorage
      const projectContext = localStorage.getItem('response-insight-project-context');
      if (projectContext) {
        const context = JSON.parse(projectContext);
        // Create a single project item from current context
        const project: ProjectHistoryItem = {
          id: Date.now().toString(),
          name: `${context.clientName} - ${context.studyObjective}`,
          createdAt: new Date(),
          industry: context.industry,
          clientName: context.clientName,
          columnsProcessed: 0, // Would need to track this
          codeframesGenerated: 0, // Would need to track this
          status: 'in_progress'
        };
        setProjects([project]);
      }
    } catch (error) {
      console.error('Error loading project history:', error);
    }
  };

  const loadSavedCodeframes = () => {
    try {
      const savedCodeframes = localStorage.getItem('response-insight-uploaded-codeframes');
      if (savedCodeframes) {
        setSavedCodeframes(JSON.parse(savedCodeframes));
      }
    } catch (error) {
      console.error('Error loading saved codeframes:', error);
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all project history? This cannot be undone.')) {
      localStorage.removeItem('response-insight-project-context');
      localStorage.removeItem('response-insight-uploaded-codeframes');
      setProjects([]);
      setSavedCodeframes([]);
      toast({
        title: "History Cleared",
        description: "All project history has been removed",
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Project Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your verbatim coding projects and saved codeframes
            </p>
          </div>
          <Link to="/">
            <Button>
              <ArrowRight className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Projects</CardDescription>
              <CardTitle className="text-2xl">{projects.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Saved Codeframes</CardDescription>
              <CardTitle className="text-2xl">{savedCodeframes.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last Activity</CardDescription>
              <CardTitle className="text-2xl">
                {projects.length > 0 ? 'Today' : 'No activity'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Projects</CardTitle>
              {projects.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear History
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No projects yet. Start a new project to see it here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{project.name}</h3>
                        <Badge
                          variant={
                            project.status === 'complete'
                              ? 'default'
                              : project.status === 'in_progress'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(project.createdAt)}
                        </span>
                        <span>{project.industry}</span>
                        <span>{project.clientName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to="/">
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Codeframes */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Codeframes</CardTitle>
            <CardDescription>
              Reusable codeframes for consistent coding across projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {savedCodeframes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved codeframes yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedCodeframes.map((codeframe, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <h4 className="font-medium mb-1">{codeframe.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {codeframe.entries?.length || 0} codes
                    </p>
                    <div className="flex gap-2">
                      <Link to="/">
                        <Button variant="outline" size="sm">
                          Use in Project
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;