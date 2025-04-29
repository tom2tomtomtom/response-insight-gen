
export interface UploadedFile {
  id?: string;
  filename: string;
  uploadedAt?: Date;
  status: 'uploaded' | 'processing' | 'complete' | 'failed';
}

export interface CodeframeEntry {
  code: string;
  label: string;
  definition: string;
  examples: string[];
}

export interface CodedResponse {
  responseText: string;
  codesAssigned: string[];
}

export interface ProcessedResult {
  codeframe: CodeframeEntry[];
  codedResponses: CodedResponse[];
  status: 'complete' | 'processing' | 'failed';
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiConfig {
  apiKey: string;
  apiUrl: string;
  isConfigured: boolean;
}
