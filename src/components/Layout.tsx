import React from 'react';
import AiSky from './AiSky';
import { useProcessing } from '../contexts/ProcessingContext';
import { Button } from './ui/button';
import { Settings2 } from 'lucide-react';
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
    if (location.pathname === '/') {
      // If we're on the homepage, scroll to the API config section
      const apiConfigElement = document.querySelector('#api-config-section');
      if (apiConfigElement) {
        apiConfigElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    } else {
      // Otherwise navigate to homepage
      navigate('/');
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col relative">
      <AiSky />
      
      <header className="bg-white/80 backdrop-blur-sm shadow-sm py-4 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">monigle codify</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Alpha Version</span>
            
            <Button variant={apiConfig?.isConfigured ? "outline" : "default"} size="sm" className={`flex items-center gap-1 ${apiConfig?.isConfigured ? 'border-green-500 text-green-600' : ''}`} onClick={handleConfigClick}>
              <Settings2 className="h-4 w-4" />
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
    </div>;
};
export default Layout;