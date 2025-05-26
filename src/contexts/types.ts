
import { ProcessedResult, UploadedFile, ApiConfig, ColumnInfo, UploadedCodeframe, ColumnSetting, ProjectContext, CodeframeEntry } from '../types';

export type QuestionType = 'brand_awareness' | 'brand_description' | 'miscellaneous';

export interface ProcessingContextType {
  uploadedFile: UploadedFile | null;
  isUploading: boolean;
  isProcessing: boolean;
  processingStatus: string;
  processingProgress: number;
  results: ProcessedResult | null;
  isGeneratingExcel: boolean;
  rawResponses: string[];
  apiConfig: ApiConfig | null;
  fileColumns: ColumnInfo[];
  selectedColumns: number[];
  searchQuery: string;
  uploadedCodeframes: UploadedCodeframe[];
  uploadedCodeframe: UploadedCodeframe | null;
  activeCodeframe: UploadedCodeframe | null;
  rawFileData: any[][] | null;
  columnQuestionTypes: Record<number, QuestionType>;
  columnSettings: Record<number, ColumnSetting>;
  multipleCodeframes: Record<string, any> | null;
  insights: string | null;
  projectContext: ProjectContext | null;
  isRefinementMode: boolean;
  setApiConfig: (config: ApiConfig) => void;
  testApiConnection: (apiKey: string, apiUrl: string) => Promise<boolean>;
  handleFileUpload: (file: File) => Promise<void>;
  startProcessing: () => Promise<void>;
  downloadResults: () => Promise<void>;
  resetState: () => void;
  toggleColumnSelection: (columnIndex: number) => void;
  selectMultipleColumns: (columnIndices: number[], shouldSelect: boolean) => void;
  setSearchQuery: (query: string) => void;
  saveUploadedCodeframe: (codeframe: UploadedCodeframe) => void;
  setActiveCodeframe: (codeframe: UploadedCodeframe | null) => void;
  setColumnQuestionType: (columnIndex: number, questionType: string) => void;
  updateColumnSetting: (columnIndex: number, setting: keyof ColumnSetting, value: boolean) => void;
  setProjectContext: (context: ProjectContext | null) => void;
  toggleRefinementMode: () => void;
  refineCodeframe: (codeframe: CodeframeEntry[]) => Promise<void>;
}
