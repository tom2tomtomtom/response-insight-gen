
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
  columnName?: string; // Add column name to preserve context
  columnIndex?: number; // Add column index for reference
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

export interface ColumnStats {
  textPercentage: number;  // Percentage of cells that contain text
  numericPercentage: number; // Percentage of cells that contain numbers
  textLength: number;  // Average length of text in the column
  nonEmptyCount: number; // Count of non-empty cells
  totalCount: number;  // Total cells in column
}

export interface ColumnInfo {
  index: number;  // Column index
  name: string;   // Column name/header
  type: 'text' | 'numeric' | 'mixed' | 'empty'; // Type of data in the column
  examples: string[]; // Example values (first few values)
  stats: ColumnStats; // Statistics about the column
}
