
import React from 'react';
import AiSky from './AiSky';
import { useProcessing } from '../contexts/ProcessingContext';
import { Button } from './ui/button';
import { Settings2, FileCode, Home, Key, LayoutDashboard, FolderOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  const {
    apiConfig
  } = useProcessing();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleConfigClick = () => {
    navigate('/api-config');
  };

  const handleCodeframeUploadClick = () => {
    navigate('/upload-codeframe');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col relative">
      <AiSky />
      
      <header className="bg-white/80 backdrop-blur-sm shadow-sm py-4 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">monigle codify</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Alpha Version</span>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2" 
              onClick={() => navigate('/projects')}
            >
              <FolderOpen className="h-4 w-4" />
              Projects
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2" 
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>

            {location.pathname !== '/' && apiConfig?.isConfigured && (
              <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleHomeClick}>
                <Home className="h-4 w-4" />
                Home
              </Button>
            )}

            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleCodeframeUploadClick}>
              <FileCode className="h-4 w-4" />
              Upload Codeframe
            </Button>
            
            <Button 
              variant={apiConfig?.isConfigured ? "outline" : "default"} 
              size="sm" 
              className={`flex items-center gap-1 ${apiConfig?.isConfigured ? 'border-green-500 text-green-600' : ''}`} 
              onClick={handleConfigClick}
            >
              <Key className="h-4 w-4" />
              {apiConfig?.isConfigured ? "API Configured" : "Configure API"}
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8 relative z-10">
        {children}
      </main>
      
      <footer className="bg-white/80 backdrop-blur-sm border-t py-4 px-6 relative z-10">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Verbatim Coder - AI-Powered Survey Response Analysis
        </div>
      </footer>
    </div>
  );
};

export default Layout;
