
import { ApiResponse, ProcessedResult, UploadedFile } from "../types";

// In a real-world scenario, this would point to your actual API endpoint
const API_BASE_URL = "https://api.example.com";

// Mock data for demonstration purposes
let mockFileId = "mock-file-id";
let processingTimer: ReturnType<typeof setTimeout>;

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

const mockResponses = [
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

// Upload file to server
export const uploadFile = async (file: File): Promise<ApiResponse<UploadedFile>> => {
  // In a real implementation, this would be a fetch call to your API
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
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
export const processFile = async (fileId: string): Promise<ApiResponse<UploadedFile>> => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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

// Get the processing status and results
export const getProcessingResult = async (fileId: string): Promise<ApiResponse<ProcessedResult>> => {
  try {
    // Simulate processing delay (in a real app, this would check the actual status)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock results
    return {
      success: true,
      data: {
        codeframe: mockCodeframe,
        codedResponses: mockResponses,
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
  // In a real implementation, this would call an API endpoint that returns a Blob
  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // This is just a placeholder - in a real app, the API would return an actual Excel file
    return new Blob(['Excel file content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } catch (error) {
    throw new Error('Failed to generate Excel file');
  }
};
