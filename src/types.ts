export interface UploadedFile {
  id?: string;
  filename: string;
  uploadedAt?: Date;
  status: 'uploaded' | 'processing' | 'complete' | 'failed';
}

export interface ProjectContext {
  industry: string;
  clientName: string;
  studyObjective: string;
  studyType: 'tracking' | 'new';
}

export interface CodeframeEntry {
  code: string;
  numeric: string; // Adding numeric code support
  label: string;
  definition: string;
  examples: string[];
  count?: number; // Track count of usages
  percentage?: number; // Track percentage of responses
}

export interface CodedResponse {
  responseText: string;
  codesAssigned: string[];
  columnName?: string; // Add column name to preserve context
  columnIndex?: number; // Add column index for reference
  rowIndex?: number; // Add row index for respondent ID
}

export interface CodeSummary {
  code: string;
  numeric: string;
  label: string;
  count: number;
  percentage: number;
}

// Add interfaces for the specialized data structures
export interface BrandHierarchy {
  [parentSystem: string]: string[];
}

export interface AttributeTheme {
  [theme: string]: string[];
}

// Add interface for question-type specific codeframe data
export interface QuestionTypeCodeframe {
  codeframe: CodeframeEntry[];
  codeSummary: CodeSummary[];
  brandHierarchies?: BrandHierarchy; // For brand awareness questions
  attributeThemes?: AttributeTheme; // For brand description questions
}

export interface ProcessedResult {
  codeframe: CodeframeEntry[];
  codedResponses: CodedResponse[];
  codeSummary: CodeSummary[]; // Add summary stats for codes
  status: 'complete' | 'processing' | 'failed';
  error?: string;
  // Add the new properties
  multipleCodeframes?: Record<string, QuestionTypeCodeframe>;
  insights?: string; // For AI-generated commentary
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
  settings?: ColumnSetting; // Add settings property
  dataWithIndices?: Array<{value: any, rowIndex: number}>; // Column data with row indices
}

export interface ColumnSetting {
  hasNets?: boolean;
  isMultiResponse?: boolean;
  samplingThreshold?: number; // Add sampling threshold setting
}

export interface UploadedCodeframe {
  name: string;
  entries: CodeframeEntry[];
}

export interface BrandEntry {
  id: string;
  name: string;
  variants: string[];
  system?: string;
}

export interface ColumnQuestionConfig {
  questionType: string;
  fullQuestionText: string;
  hasExistingCodeframe: boolean;
  codeframeFile?: File;
}

export interface EnhancedColumnSetting extends ColumnSetting {
  questionConfig?: ColumnQuestionConfig;
  brandList?: BrandEntry[];
  samplingThreshold?: number;
  fullQuestionText?: string;
}

export interface TrackingStudyConfig {
  isPriorCodeframe: boolean;
  priorCodeframe?: CodeframeEntry[];
  waveNumber?: number;
}

export interface CodeframeGenerationRules {
  minimumPercentage: number; // Default 3%
  includeCatchalls: boolean; // Always include Other, None, N/A
  useNumericIds: boolean; // Use numeric IDs only
  enforceThresholds: boolean;
}

export interface CodeframeApplicationRule {
  questionId: string;
  codeLabel: string;
  codeId: string;
  hierarchy: 'Grand Net' | 'Net' | 'Subnet';
  group?: string;
  keywords?: string[];
  semanticMatches?: string[];
}

export interface AppliedCode {
  code_id: string;
  label: string;
  hierarchy: string;
  group?: string;
  confidence?: number;
}

export interface CodedVerbatimResponse {
  respondent_id: string;
  question_id: string;
  response: string;
  codes_applied: AppliedCode[];
}

export interface CodeframeApplicationResult {
  codedResponses: CodedVerbatimResponse[];
  moniglewCsv: string;
  questionsProcessed: number;
  responsesProcessed: number;
}
