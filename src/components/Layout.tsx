
import React from 'react';
import AiSky from './AiSky';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col relative">
      <AiSky />
      
      <header className="bg-white/80 backdrop-blur-sm shadow-sm py-4 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold">
              V
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Verbatim Coder
            </h1>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Alpha Version</span>
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
