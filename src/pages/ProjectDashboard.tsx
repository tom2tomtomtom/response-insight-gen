import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { 
  FolderOpen, 
  Plus, 
  Clock, 
  FileText, 
  Trash2, 
  Download,
  Search,
  Filter,
  Calendar,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '../components/ui/use-toast';

interface ProjectRecord {
  id: string;
  name: string;
  client: string;
  industry: string;
  objective: string;
  studyType: 'ad-hoc' | 'tracking';
  createdAt: Date;
  lastModified: Date;
  status: 'draft' | 'processing' | 'complete' | 'finalized';
  statistics: {
    columnsProcessed: number;
    responsesAnalyzed: number;
    codesGenerated: number;
    codeframesCreated: number;
  };
  version: number;
}

const STORAGE_KEY = 'response-insight-projects';

const ProjectDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load projects from localStorage
  useEffect(() => {
    const loadProjects = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert date strings back to Date objects
          const projectsWithDates = parsed.map((p: any) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            lastModified: new Date(p.lastModified)
          }));
          setProjects(projectsWithDates);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    loadProjects();
    
    // Listen for storage events from other tabs
    window.addEventListener('storage', loadProjects);
    return () => window.removeEventListener('storage', loadProjects);
  }, []);

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.industry.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Group projects by status
  const projectsByStatus = {
    draft: filteredProjects.filter(p => p.status === 'draft'),
    processing: filteredProjects.filter(p => p.status === 'processing'),
    complete: filteredProjects.filter(p => p.status === 'complete'),
    finalized: filteredProjects.filter(p => p.status === 'finalized')
  };

  const handleOpenProject = (project: ProjectRecord) => {
    // Store the selected project ID
    localStorage.setItem('response-insight-active-project', project.id);
    
    // Navigate to main app with project context
    navigate('/', { state: { projectId: project.id } });
  };

  const handleDeleteProject = (project: ProjectRecord) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!selectedProject) return;

    // Remove project from list
    const updatedProjects = projects.filter(p => p.id !== selectedProject.id);
    setProjects(updatedProjects);
    
    // Update localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    
    // Clear related data
    const projectKeys = Object.keys(localStorage).filter(key => 
      key.includes(selectedProject.id)
    );
    projectKeys.forEach(key => localStorage.removeItem(key));
    
    toast({
      title: "Project Deleted",
      description: `"${selectedProject.name}" has been removed.`
    });
    
    setShowDeleteDialog(false);
    setSelectedProject(null);
  };

  const handleExportProject = (project: ProjectRecord) => {
    // Create project export data
    const exportData = {
      project,
      data: {} as any
    };

    // Collect all related localStorage data
    Object.keys(localStorage).forEach(key => {
      if (key.includes(project.id)) {
        exportData.data[key] = localStorage.getItem(key);
      }
    });

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_export_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Project Exported",
      description: "Project data has been downloaded."
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'processing': return 'default';
      case 'complete': return 'success';
      case 'finalized': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4 animate-spin" />;
      case 'complete': return <BarChart3 className="h-4 w-4" />;
      case 'finalized': return <FolderOpen className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your verbatim coding projects
            </p>
          </div>
          <Button onClick={() => navigate('/')} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Project
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects by name, client, or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('draft')}
                >
                  Draft
                </Button>
                <Button
                  variant={filterStatus === 'complete' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('complete')}
                >
                  Complete
                </Button>
                <Button
                  variant={filterStatus === 'finalized' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('finalized')}
                >
                  Finalized
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {searchQuery || filterStatus !== 'all' 
                  ? "Try adjusting your search or filters"
                  : "Create your first project to get started"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.client} • {project.industry}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(project.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(project.status)}
                        {project.status}
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {project.objective}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{project.studyType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Version</p>
                      <p className="font-medium">v{project.version}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Responses</p>
                      <p className="font-medium">{project.statistics.responsesAnalyzed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Codes</p>
                      <p className="font-medium">{project.statistics.codesGenerated}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Modified {format(project.lastModified, 'MMM d, yyyy')}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleOpenProject(project)}
                  >
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportProject(project)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProject(project)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {projects.reduce((sum, p) => sum + p.statistics.responsesAnalyzed, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Responses Analyzed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {projects.reduce((sum, p) => sum + p.statistics.codesGenerated, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Codes Generated</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {projects.filter(p => p.status === 'finalized').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Finalized Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Project?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedProject?.name}"? 
                This action cannot be undone and will remove all associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProjectDashboard;