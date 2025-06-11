// API Client for Backend Communication
const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('qualicoding-auth-token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      };

      const response = await fetch(url, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const result = await this.request<{ token: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (result.success && result.data?.token) {
      this.token = result.data.token;
      localStorage.setItem('qualicoding-auth-token', this.token);
    }

    return result;
  }

  async validateToken() {
    return this.request('/auth/validate', { method: 'POST' });
  }

  logout() {
    this.token = null;
    localStorage.removeItem('qualicoding-auth-token');
  }

  // Projects
  async getProjects() {
    return this.request('/projects');
  }

  async createProject(projectData: {
    clientName: string;
    projectType: string;
    waveNumber?: string;
    notes?: string;
  }) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getProject(projectId: string) {
    return this.request(`/projects/${projectId}`);
  }

  async updateProject(projectId: string, updates: any) {
    return this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(projectId: string) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // File Upload
  async uploadFile(projectId: string, file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers: HeadersInit = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseURL}/upload/${projectId}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('File upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async getFileMetadata(projectId: string) {
    return this.request(`/upload/${projectId}/file`);
  }

  async getSampleData(projectId: string, columns: number[], sampleSize: number = 100) {
    const columnParams = columns.join(',');
    return this.request(`/upload/${projectId}/sample?columns=${columnParams}&sampleSize=${sampleSize}`);
  }

  // Codeframes
  async generateCodeframe(projectId: string, groupData: {
    groupId: string;
    groupName: string;
    questionType: string;
    columns: number[];
    samplePercentage?: number;
  }) {
    return this.request(`/codeframes/${projectId}/generate`, {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async finalizeCodeframe(projectId: string, groupId: string, codeframe: any[]) {
    return this.request(`/codeframes/${projectId}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ groupId, codeframe }),
    });
  }

  async getCodeframes(projectId: string) {
    return this.request(`/codeframes/${projectId}`);
  }

  async exportResults(projectId: string): Promise<Blob | null> {
    try {
      const headers: HeadersInit = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseURL}/codeframes/${projectId}/export`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Export failed:', error);
      return null;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;