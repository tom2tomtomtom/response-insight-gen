
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ApiKeyConfig from '../components/ApiKeyConfig';
import { useProcessing } from '../contexts/ProcessingContext';
import { useEffect } from 'react';

const ApiConfig: React.FC = () => {
  const { apiConfig } = useProcessing();
  const navigate = useNavigate();

  // Redirect to home if API is already configured
  useEffect(() => {
    if (apiConfig?.isConfigured) {
      navigate('/');
    }
  }, [apiConfig?.isConfigured, navigate]);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">API Configuration</h1>
          <p className="text-muted-foreground">Configure your OpenAI API key to get started with analysis</p>
        </div>
        
        <div className="w-full max-w-2xl mx-auto">
          <ApiKeyConfig />
        </div>
      </div>
    </Layout>
  );
};

export default ApiConfig;
