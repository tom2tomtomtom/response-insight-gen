
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProcessingProvider } from './contexts/ProcessingContext';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import NewDashboard from './pages/NewDashboard';
import ProjectSetup from './pages/ProjectSetup';
import ProjectUpload from './pages/ProjectUpload';
import ProjectColumns from './pages/ProjectColumns';
import ProjectGrouping from './pages/ProjectGrouping';
import ProjectGenerate from './pages/ProjectGenerate';
import ProjectResults from './pages/ProjectResults';
import NotFound from './pages/NotFound';
import './App.css';
import './styles/excel-table.css';

function App() {
  return (
    <ProcessingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <NewDashboard />
            </ProtectedRoute>
          } />
          <Route path="/project/new" element={
            <ProtectedRoute>
              <ProjectSetup />
            </ProtectedRoute>
          } />
          <Route path="/project/:projectId/upload" element={
            <ProtectedRoute>
              <ProjectUpload />
            </ProtectedRoute>
          } />
          <Route path="/project/:projectId/columns" element={
            <ProtectedRoute>
              <ProjectColumns />
            </ProtectedRoute>
          } />
          <Route path="/project/:projectId/grouping" element={
            <ProtectedRoute>
              <ProjectGrouping />
            </ProtectedRoute>
          } />
          <Route path="/project/:projectId/generate" element={
            <ProtectedRoute>
              <ProjectGenerate />
            </ProtectedRoute>
          } />
          <Route path="/project/:projectId/results" element={
            <ProtectedRoute>
              <ProjectResults />
            </ProtectedRoute>
          } />
          <Route path="/404" element={<NotFound />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </ProcessingProvider>
  );
}

export default App;
