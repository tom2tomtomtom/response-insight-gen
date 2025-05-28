
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProcessingProvider } from './contexts/ProcessingContext';
import { Toaster } from './components/ui/toaster';
import Index from './pages/Index';
import ApiConfig from './pages/ApiConfig';
import NotFound from './pages/NotFound';
import UploadCodeframe from './pages/UploadCodeframe';
import './App.css';
import './styles/excel-table.css';

function App() {
  return (
    <ProcessingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/api-config" element={<ApiConfig />} />
          <Route path="/upload-codeframe" element={<UploadCodeframe />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ProcessingProvider>
  );
}

export default App;
