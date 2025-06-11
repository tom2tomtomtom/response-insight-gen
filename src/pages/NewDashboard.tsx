import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CleanLayout from '../components/CleanLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Plus, 
  FolderOpen, 
  Search, 
  Calendar,
  FileText,
  BarChart3,
  Clock,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '../components/ui/use-toast';

interface Project {
  id: string;
  clientName: string;
  projectType: string;
  waveNumber: string;
  dateCreated: Date;
  lastModified: Date;
  status: 'draft' | 'processing' | 'complete';
}

const NewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load projects from localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem('qualicoding-projects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        const projectsWithDates = parsed.map((p: any) => ({
          ...p,
          dateCreated: new Date(p.dateCreated),
          lastModified: new Date(p.lastModified)
        }));
        setProjects(projectsWithDates);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    }
  }, []);

  const filteredProjects = projects.filter(project =>
    project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.projectType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewProject = () => {
    navigate('/project/new');
  };

  const handleOpenProject = (projectId: string) => {
    localStorage.setItem('qualicoding-active-project', projectId);
    navigate(`/project/${projectId}`);
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    localStorage.setItem('qualicoding-projects', JSON.stringify(updatedProjects));
    
    toast({
      title: "Project deleted",
      description: "The project has been removed from your workspace.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'processing': return 'default';
      case 'complete': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'complete': return <BarChart3 className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <CleanLayout title="My Projects">
      <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
            <p className="text-slate-600 mt-1">Manage your qualitative coding projects</p>
          </div>
          <Button onClick={handleNewProject} size="lg" className="mt-4 sm:mt-0">
            <Plus className="h-5 w-5 mr-2" />
            New Project
          </Button>
        </div>

        {/* Search and stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search projects by client name or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="text-center lg:text-right">
            <div className="text-2xl font-bold text-slate-900">{projects.length}</div>
            <div className="text-sm text-slate-600">Total Projects</div>
          </div>
        </div>

        {/* Projects grid */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-slate-600 text-center max-w-sm mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Create your first project to start analyzing survey responses with AI-powered coding'
                }
              </p>
              {!searchQuery && (
                <Button onClick={handleNewProject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.clientName}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.projectType}
                        {project.waveNumber && ` • Wave ${project.waveNumber}`}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(project.status)} className="ml-2">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(project.status)}
                        {project.status}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-slate-600 mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    Created {format(project.dateCreated, 'MMM d, yyyy')}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleOpenProject(project.id)}
                    >
                      Open
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CleanLayout>
  );
};

export default NewDashboard;