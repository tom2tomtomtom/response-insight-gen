import { ApiResponse, ProcessedResult, UploadedFile } from "../types";
import * as XLSX from 'xlsx';

// Default API endpoint for the mock service
const DEFAULT_API_URL = "https://api.example.com";

// Mock data for demonstration purposes
let mockFileId = "mock-file-id";
let processingTimer: ReturnType<typeof setTimeout>;
let userUploadedResponses: string[] = [];

const mockCodeframe = [
  {
    code: "C01",
    label: "Ease of Use",
    definition: "Comments related to how easy or difficult the product is to use",
    examples: ["Very intuitive interface", "Easy to navigate", "Straightforward to set up"]
  },
  {
    code: "C02",
    label: "Performance",
    definition: "Comments about the speed, reliability, or efficiency of the product",
    examples: ["Runs smoothly", "No lag time", "Quick response"]
  },
  {
    code: "C03",
    label: "Features",
    definition: "Mentions of specific product features or functionality",
    examples: ["Love the search capability", "The dashboard is comprehensive", "Export feature saves time"]
  },
  {
    code: "C04",
    label: "Value",
    definition: "Comments about price, ROI, or overall value proposition",
    examples: ["Worth every penny", "Good price for what you get", "Expensive but worth it"]
  },
  {
    code: "C05",
    label: "Support",
    definition: "Feedback about customer service or technical support",
    examples: ["Support team was helpful", "Quick response to my questions", "Documentation is thorough"]
  }
];

// Helper function to extract real responses and randomly assign codes from the codeframe
const generateMockCodedResponses = (responses: string[]) => {
  return responses.map(responseText => {
    // Randomly assign 1-2 codes to each response
    const numCodes = Math.floor(Math.random() * 2) + 1;
    const allCodes = mockCodeframe.map(item => item.code);
    const shuffledCodes = [...allCodes].sort(() => Math.random() - 0.5);
    const codesAssigned = shuffledCodes.slice(0, numCodes);
    
    return {
      responseText,
      codesAssigned
    };
  });
};

// Test API connection with provided key
export const testApiConnection = async (apiKey: string, apiUrl: string): Promise<boolean> => {
  try {
    // In a real implementation, this would check if the API key is valid
    // Here, we'll just simulate a check
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For now, we'll assume any non-empty key is valid
    if (!apiKey.trim()) {
      throw new Error("API key is required");
    }
    
    // Return success
    return true;
  } catch (error) {
    console.error("API connection test failed:", error);
    throw error;
  }
};

// Upload file to server
export const uploadFile = async (file: File, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<UploadedFile>> => {
  // In a real implementation, this would be a fetch call to your API
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // If we have API config, we'd use it here to make a real API call
    if (apiConfig?.apiKey) {
      console.log(`Using API key ${apiConfig.apiKey.substring(0, 3)}... to upload to ${apiConfig.apiUrl || DEFAULT_API_URL}`);
      // In a real implementation:
      // return await fetch(`${apiConfig.apiUrl || DEFAULT_API_URL}/upload`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${apiConfig.apiKey}` },
      //   body: formData
      // }).then(res => res.json());
    }
    
    // Simulate API response
    return {
      success: true,
      data: {
        id: mockFileId,
        filename: file.name,
        status: 'uploaded',
        uploadedAt: new Date()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Process the uploaded file
export const processFile = async (fileId: string, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<UploadedFile>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // If we have API config, we'd use it here to make a real API call
    if (apiConfig?.apiKey) {
      console.log(`Using API key ${apiConfig.apiKey.substring(0, 3)}... to process file at ${apiConfig.apiUrl || DEFAULT_API_URL}`);
      // In a real implementation:
      // return await fetch(`${apiConfig.apiUrl || DEFAULT_API_URL}/process/${fileId}`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${apiConfig.apiKey}` }
      // }).then(res => res.json());
    }
    
    // Start mock processing timer
    clearTimeout(processingTimer);
    
    // Simulate API response
    return {
      success: true,
      data: {
        id: fileId,
        filename: 'responses.xlsx',
        status: 'processing'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Store the real responses for use in the API
export const setUserResponses = (responses: string[]) => {
  userUploadedResponses = responses;
};

// Get the processing status and results
export const getProcessingResult = async (fileId: string, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<ProcessedResult>> => {
  try {
    // Simulate processing delay (in a real app, this would check the actual status)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // If we have API config, we'd use it here to make a real API call
    if (apiConfig?.apiKey) {
      console.log(`Using API key ${apiConfig.apiKey.substring(0, 3)}... to get results from ${apiConfig.apiUrl || DEFAULT_API_URL}`);
      // In a real implementation:
      // return await fetch(`${apiConfig.apiUrl || DEFAULT_API_URL}/results/${fileId}`, {
      //   headers: { 'Authorization': `Bearer ${apiConfig.apiKey}` }
      // }).then(res => res.json());
    }
    
    // Use real uploaded responses if available
    const codedResponses = userUploadedResponses.length > 0
      ? generateMockCodedResponses(userUploadedResponses)
      : [
          {
            responseText: "The interface is so intuitive, I was able to figure it out without reading any instructions.",
            codesAssigned: ["C01"]
          },
          {
            responseText: "Sometimes it runs slowly when processing large files, but overall it's been reliable.",
            codesAssigned: ["C02"]
          },
          {
            responseText: "I love the export to Excel feature, it saves me hours every week. Well worth the price!",
            codesAssigned: ["C03", "C04"]
          },
          {
            responseText: "Customer support responded within minutes when I had a question. The dashboard is also great.",
            codesAssigned: ["C05", "C03"]
          },
          {
            responseText: "Very easy to use and the price is reasonable for what you get.",
            codesAssigned: ["C01", "C04"]
          },
          {
            responseText: "The documentation is excellent and the interface is straightforward.",
            codesAssigned: ["C05", "C01"]
          },
          {
            responseText: "No lag time even with large datasets. The filtering options are impressive.",
            codesAssigned: ["C02", "C03"]
          },
          {
            responseText: "Worth every penny for the time it saves me. Support team is also very knowledgeable.",
            codesAssigned: ["C04", "C05"]
          }
        ];
    
    // Return mock results
    return {
      success: true,
      data: {
        codeframe: mockCodeframe,
        codedResponses: codedResponses,
        status: 'complete'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Function to generate an Excel file from the results
export const generateExcelFile = async (result: ProcessedResult): Promise<Blob> => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Create the Codeframe worksheet
    const codeframeData = result.codeframe.map(code => ({
      Code: code.code,
      Label: code.label,
      Definition: code.definition,
      Examples: code.examples.join('; ')
    }));
    const codeframeWorksheet = XLSX.utils.json_to_sheet(codeframeData);
    XLSX.utils.book_append_sheet(workbook, codeframeWorksheet, "Codeframe");
    
    // Create the Coded Responses worksheet
    const responsesData = result.codedResponses.map(response => ({
      Response: response.responseText,
      Codes: response.codesAssigned.join('; ')
    }));
    const responsesWorksheet = XLSX.utils.json_to_sheet(responsesData);
    XLSX.utils.book_append_sheet(workbook, responsesWorksheet, "Coded Responses");
    
    // Generate the Excel file as a binary string
    const excelBinary = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    
    // Convert binary string to ArrayBuffer
    const buffer = new ArrayBuffer(excelBinary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < excelBinary.length; i++) {
      view[i] = excelBinary.charCodeAt(i) & 0xFF;
    }
    
    // Create a Blob from the ArrayBuffer
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw new Error('Failed to generate Excel file');
  }
};
