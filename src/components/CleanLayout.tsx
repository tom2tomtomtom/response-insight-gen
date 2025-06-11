import React from 'react';
import { Button } from './ui/button';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from './ui/use-toast';

interface CleanLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showLogout?: boolean;
}

const CleanLayout: React.FC<CleanLayoutProps> = ({ 
  children, 
  title = "Qualitative Coding", 
  subtitle,
  showLogout = true 
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { apiClient } = await import('../services/apiClient');
      apiClient.logout();
      localStorage.removeItem('qualicoding-auth');
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still proceed with logout even if API call fails
      localStorage.removeItem('qualicoding-auth');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Clean header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
              {subtitle && (
                <span className="ml-3 text-sm text-slate-500">• {subtitle}</span>
              )}
            </div>
            
            {showLogout && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-slate-600">
                  <User className="h-4 w-4 mr-2" />
                  Insights Team
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Content area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default CleanLayout;