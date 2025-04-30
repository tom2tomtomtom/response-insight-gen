
import { ApiResponse, ProcessedResult, UploadedFile, ColumnInfo } from "../types";
import * as XLSX from 'xlsx';

// Default API endpoint for the text analysis service
const DEFAULT_API_URL = "https://api.textanalysis.com/v1";

// Store selected columns for processing
let userSelectedColumns: ColumnInfo[] = [];

// Set selected columns
export const setSelectedColumns = (columns: ColumnInfo[]) => {
  userSelectedColumns = columns;
};

// Test API connection with provided key
export const testApiConnection = async (apiKey: string, apiUrl: string): Promise<boolean> => {
  try {
    // Make a real API call to test the connection
    const response = await fetch(`${apiUrl || DEFAULT_API_URL}/test`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API returned status ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error("API connection test failed:", error);
    throw error;
  }
};

// Upload file to the analysis service
export const uploadFile = async (file: File, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<UploadedFile>> => {
  try {
    if (!apiConfig?.apiKey) {
      // For demo purposes, generate a mock response if no API key is provided
      return mockUploadFile(file);
    }
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Make actual API call
    const response = await fetch(`${apiConfig.apiUrl || DEFAULT_API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data: {
        id: data.fileId,
        filename: file.name,
        status: 'uploaded',
        uploadedAt: new Date()
      }
    };
  } catch (error) {
    console.error("File upload failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Mock upload function for demo purposes when no API key is provided
const mockUploadFile = async (file: File): Promise<ApiResponse<UploadedFile>> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    data: {
      id: "demo-file-id",
      filename: file.name,
      status: 'uploaded',
      uploadedAt: new Date()
    }
  };
};

// Process the uploaded file
export const processFile = async (fileId: string, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<UploadedFile>> => {
  try {
    if (!apiConfig?.apiKey) {
      // For demo purposes, return a mock response if no API key is provided
      return mockProcessFile(fileId);
    }
    
    // Prepare the processing request with selected columns
    const requestBody = {
      fileId,
      columns: userSelectedColumns
    };
    
    // Make the actual API call
    const response = await fetch(`${apiConfig.apiUrl || DEFAULT_API_URL}/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Processing failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data: {
        id: fileId,
        filename: data.filename || 'processed_file.xlsx',
        status: 'processing'
      }
    };
  } catch (error) {
    console.error("File processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Mock process function for demo purposes when no API key is provided
const mockProcessFile = async (fileId: string): Promise<ApiResponse<UploadedFile>> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    data: {
      id: fileId,
      filename: 'responses.xlsx',
      status: 'processing'
    }
  };
};

// Store user responses
let userUploadedResponses: string[] = [];

// Store the real responses for use in the API
export const setUserResponses = (responses: string[]) => {
  userUploadedResponses = responses;
};

// Get the processing result
export const getProcessingResult = async (fileId: string, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<ProcessedResult>> => {
  try {
    if (!apiConfig?.apiKey) {
      // For demo purposes, return a mock response if no API key is provided
      return mockGetProcessingResult(fileId);
    }
    
    // Make the actual API call
    const response = await fetch(`${apiConfig.apiUrl || DEFAULT_API_URL}/results/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiConfig.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Getting results failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data: {
        codeframe: data.codeframe,
        codedResponses: data.codedResponses,
        status: 'complete'
      }
    };
  } catch (error) {
    console.error("Getting processing results failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Mock processing result function for demo purposes when no API key is provided
const mockGetProcessingResult = async (fileId: string): Promise<ApiResponse<ProcessedResult>> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock codeframe for demonstration
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
  
  // Generate mock coded responses based on user-uploaded data
  const generateMockCodedResponses = () => {
    // If we have selected columns, use that data
    if (userSelectedColumns.length > 0 && userUploadedResponses.length > 0) {
      console.log("Generating mock results from user data");
      
      const result = [];
      
      // Use responses from each selected column
      for (const column of userSelectedColumns) {
        const examples = column.examples || [];
        
        // For each example in the column, create a coded response
        for (let i = 0; i < examples.length && i < 5; i++) {
          const responseText = examples[i];
          
          // Only include substantive responses
          if (responseText && responseText.length > 5) {
            // Randomly assign 1-2 codes
            const numCodes = Math.floor(Math.random() * 2) + 1;
            const allCodes = mockCodeframe.map(item => item.code);
            const shuffledCodes = [...allCodes].sort(() => Math.random() - 0.5);
            const codesAssigned = shuffledCodes.slice(0, numCodes);
            
            result.push({
              responseText,
              columnName: column.name,
              columnIndex: column.index,
              codesAssigned
            });
          }
        }
        
        // If we have user uploaded responses, use some of those too
        const columnResponses = userUploadedResponses.slice(0, 10);
        for (let i = 0; i < columnResponses.length && i < 5; i++) {
          const responseText = columnResponses[i];
          
          // Only include substantive responses
          if (responseText && responseText.length > 5) {
            // Randomly assign 1-2 codes
            const numCodes = Math.floor(Math.random() * 2) + 1;
            const allCodes = mockCodeframe.map(item => item.code);
            const shuffledCodes = [...allCodes].sort(() => Math.random() - 0.5);
            const codesAssigned = shuffledCodes.slice(0, numCodes);
            
            result.push({
              responseText,
              columnName: column.name,
              columnIndex: column.index,
              codesAssigned
            });
          }
        }
      }
      
      return result;
    }
    
    // Fallback to default mock data
    return [
      {
        responseText: "The interface is so intuitive, I was able to figure it out without reading any instructions.",
        codesAssigned: ["C01"],
        columnName: "Overall Comments",
        columnIndex: 0
      },
      {
        responseText: "Sometimes it runs slowly when processing large files, but overall it's been reliable.",
        codesAssigned: ["C02"],
        columnName: "Performance Feedback",
        columnIndex: 1
      },
      {
        responseText: "I love the export to Excel feature, it saves me hours every week. Well worth the price!",
        codesAssigned: ["C03", "C04"],
        columnName: "Feature Comments",
        columnIndex: 2
      },
      {
        responseText: "Customer support responded within minutes when I had a question. The dashboard is also great.",
        codesAssigned: ["C05", "C03"],
        columnName: "Support Experience",
        columnIndex: 3
      },
      {
        responseText: "Very easy to use and the price is reasonable for what you get.",
        codesAssigned: ["C01", "C04"],
        columnName: "Value Assessment",
        columnIndex: 4
      }
    ];
  };
  
  // Return mock results
  return {
    success: true,
    data: {
      codeframe: mockCodeframe,
      codedResponses: generateMockCodedResponses(),
      status: 'complete'
    }
  };
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
      Column: response.columnName || 'Unknown',
      Codes: response.codesAssigned.join('; ')
    }));
    const responsesWorksheet = XLSX.utils.json_to_sheet(responsesData);
    XLSX.utils.book_append_sheet(workbook, responsesWorksheet, "Coded Responses");
    
    // Create column-specific worksheets if we have column information
    const columnResponses = new Map<string, any[]>();
    
    // Group responses by column
    result.codedResponses.forEach(response => {
      if (response.columnName) {
        const key = response.columnName;
        if (!columnResponses.has(key)) {
          columnResponses.set(key, []);
        }
        columnResponses.get(key)?.push({
          Response: response.responseText,
          Codes: response.codesAssigned.join('; ')
        });
      }
    });
    
    // Create a worksheet for each column
    columnResponses.forEach((responses, columnName) => {
      const safeSheetName = columnName.substring(0, 30).replace(/[*?[\]]/g, '_'); // Ensure valid worksheet name
      const worksheet = XLSX.utils.json_to_sheet(responses);
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    });
    
    // Write the workbook to an array buffer instead of binary string
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob from the ArrayBuffer with the correct MIME type
    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw new Error('Failed to generate Excel file');
  }
};
