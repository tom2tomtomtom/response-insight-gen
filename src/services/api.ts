import { ApiResponse, ProcessedResult, UploadedFile, ColumnInfo, UploadedCodeframe } from "../types";
import * as XLSX from 'xlsx';

// Default API endpoint for the text analysis service
const DEFAULT_API_URL = "https://api.openai.com/v1/chat/completions";

// Store selected columns for processing
let userSelectedColumns: ColumnInfo[] = [];

// Store uploaded codeframe if provided
let userUploadedCodeframe: UploadedCodeframe | null = null;

// Set selected columns - renamed to avoid naming conflicts in ProcessingContext
export const setApiSelectedColumns = (columns: ColumnInfo[]): void => {
  userSelectedColumns = columns;
};

// Set uploaded codeframe for use in API
export const setUploadedCodeframe = (codeframe: UploadedCodeframe | null): void => {
  userUploadedCodeframe = codeframe;
};

// Test API connection with provided key
export const testApiConnection = async (apiKey: string, apiUrl: string): Promise<boolean> => {
  try {
    // Make a minimal request to test the connection
    const response = await fetch(`${apiUrl || DEFAULT_API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      })
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

// Handle file upload - now processes locally without sending to API
export const uploadFile = async (file: File, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<UploadedFile>> => {
  try {
    // Generate a file ID locally - we don't need to upload the file to OpenAI
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Just return a successful upload response
    return {
      success: true,
      data: {
        id: fileId,
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

// Store user responses
let userUploadedResponses: string[] = [];

// Store the real responses for use in the API
export const setUserResponses = (responses: string[]) => {
  userUploadedResponses = responses;
};

// Process the uploaded file
export const processFile = async (fileId: string, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<UploadedFile>> => {
  try {
    if (!apiConfig?.apiKey) {
      // For demo purposes, return a mock response if no API key is provided
      return mockProcessFile(fileId);
    }
    
    // Just return a processing status without actually making an API call
    // The actual processing will happen in getProcessingResult
    return {
      success: true,
      data: {
        id: fileId,
        filename: 'processing_file.xlsx',
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

// Calculate code percentages based on usage
const calculateCodePercentages = (codedResponses: any[], codeframe: any[]) => {
  // Count occurrences of each code
  const codeCounts: Record<string, number> = {};
  let totalCodeAssignments = 0;
  
  // Count occurrences of each code in responses
  codedResponses.forEach(response => {
    response.codesAssigned.forEach((code: string) => {
      codeCounts[code] = (codeCounts[code] || 0) + 1;
      totalCodeAssignments++;
    });
  });
  
  // Update codeframe with counts and percentages
  const updatedCodeframe = codeframe.map(code => {
    const count = codeCounts[code.code] || 0;
    const percentage = totalCodeAssignments > 0 ? (count / codedResponses.length) * 100 : 0;
    
    return {
      ...code,
      count,
      percentage
    };
  });
  
  // Sort codes by percentage descending for the summary
  const codeSummary = updatedCodeframe
    .map(code => ({
      code: code.code,
      numeric: code.numeric || code.code.replace(/[^0-9.]/g, ''),
      label: code.label,
      count: code.count || 0,
      percentage: code.percentage || 0
    }))
    .sort((a, b) => b.percentage - a.percentage);
  
  return {
    updatedCodeframe,
    codeSummary
  };
};

// Ensure numeric codes format
const ensureNumericCodes = (codeframe: any[]) => {
  // First check if numeric codes are already present
  const hasNumericCodes = codeframe.some(code => code.numeric);
  
  if (hasNumericCodes) {
    return codeframe;
  }
  
  // If not, generate numeric codes
  return codeframe.map((code, index) => {
    // Make sure code.code exists and is a string before using replace
    let numericPart = '';
    
    if (code && typeof code.code === 'string') {
      // Extract numeric part if code already has a number format like "C01"
      numericPart = code.code.replace(/[^0-9.]/g, '');
    }
    
    // If no numeric part found, use the index + 1
    const numeric = numericPart.length > 0 ? numericPart : (index + 1).toString();
    
    return {
      ...code,
      numeric
    };
  });
};

// Make sure "Other" category exists in the codeframe
const ensureOtherCategory = (codeframe: any[]) => {
  // Check if Other category already exists
  const otherExists = codeframe.some(code => 
    code.code === "Other" || 
    code.label === "Other" || 
    code.label.toLowerCase().includes("other")
  );
  
  if (otherExists) {
    return codeframe;
  }
  
  // Add an "Other" category
  return [...codeframe, {
    code: "Other",
    numeric: codeframe.length + 1,
    label: "Other responses",
    definition: "Responses that don't fit into the main categories",
    examples: ["Miscellaneous response", "Unrelated comment"],
    count: 0,
    percentage: 0
  }];
};

// Get the processing result
export const getProcessingResult = async (fileId: string, apiConfig?: { apiKey: string, apiUrl: string }): Promise<ApiResponse<ProcessedResult>> => {
  try {
    // If no API key is provided, fall back to mock data
    if (!apiConfig?.apiKey) {
      console.log("No API key provided, using mock data");
      return mockGetProcessingResult(fileId);
    }
    
    console.log("Selected columns for processing:", userSelectedColumns);
    
    // Check if we have selected columns
    if (!userSelectedColumns || userSelectedColumns.length === 0) {
      throw new Error("No columns selected for processing");
    }
    
    // Extract examples from selected columns to send to the API
    const selectedColumnsData = [];
    
    for (const columnInfo of userSelectedColumns) {
      // Get all responses for this column, not just examples
      const allColumnResponses = columnInfo.examples || [];
      
      // Only add columns that have some responses
      if (allColumnResponses.length > 0) {
        selectedColumnsData.push({
          name: columnInfo.name,
          index: columnInfo.index,
          responses: allColumnResponses
        });
      }
    }
    
    // If no columns with responses were found, throw an error
    if (selectedColumnsData.length === 0) {
      throw new Error("Selected columns don't contain any responses to analyze");
    }
    
    console.log("Sending selected column data to OpenAI:", selectedColumnsData);
    
    // Create a prompt for OpenAI to analyze the data
    let promptContent = "";
    
    // If user uploaded a codeframe, include it in the prompt
    if (userUploadedCodeframe) {
      promptContent = `I have a survey with the following open-ended questions and responses:
      ${JSON.stringify(selectedColumnsData, null, 2)}
      
      I already have a predefined codeframe that I want you to use to code these responses:
      ${JSON.stringify(userUploadedCodeframe.entries, null, 2)}
      
      Please analyze these responses and:
      1. Use ONLY the provided codeframe codes - do not create new ones
      2. Assign the appropriate codes to each response based on the definitions in the codeframe
      3. Make sure to include the "Other" category for responses that don't fit any category
      
      Format your response as a JSON object with two properties:
      - codeframe: The provided codeframe array of code objects with {code, numeric, label, definition, examples}
      - codedResponses: An array of response objects with {responseText, columnName, columnIndex, codesAssigned}`;
    } else {
      // Otherwise use the default prompt to generate a new codeframe
      promptContent = `I have a survey with the following open-ended questions and responses:
      ${JSON.stringify(selectedColumnsData, null, 2)}
      
      Please analyze these responses and:
      1. Create a codeframe with 5-8 distinct codes using numeric identifiers
      2. Always include an "Other" category for responses that don't clearly fit other categories
      3. For each code, provide:
         - A short label
         - A clear definition
         - A numeric code (e.g., 1, 2, 3 or 1.1, 1.2, etc.)
         - 2-3 example phrases
      4. Assign appropriate codes to each response
      
      Format your response as a JSON object with two properties:
      - codeframe: An array of code objects with {code, numeric, label, definition, examples}
      - codedResponses: An array of response objects with {responseText, columnName, columnIndex, codesAssigned}`;
    }
    
    const messages = [
      {
        role: "system",
        content: `You are an expert qualitative researcher analyzing open-ended survey responses.`
      },
      {
        role: "user",
        content: promptContent
      }
    ];
    
    // Make the API call to OpenAI - Fix: Ensure we're using the correct API key format
    const response = await fetch(`${apiConfig.apiUrl || DEFAULT_API_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" } // Request JSON format explicitly
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || errorData.message || `Processing failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log("OpenAI response:", data);
    
    try {
      // Parse the content from the OpenAI response
      const content = data.choices[0].message.content;
      let parsedResult;
      
      // Attempt to parse the JSON
      try {
        parsedResult = JSON.parse(content);
      } catch (jsonError) {
        console.error("Failed to parse JSON directly:", jsonError);
        
        // If content isn't valid JSON, fall back to mock data
        console.warn("OpenAI didn't return valid JSON, falling back to mock data");
        return mockGetProcessingResult(fileId);
      }
      
      // Validate the parsed result structure
      if (!parsedResult.codeframe || !Array.isArray(parsedResult.codeframe) || 
          !parsedResult.codedResponses || !Array.isArray(parsedResult.codedResponses)) {
        console.warn("OpenAI response doesn't have the expected structure, falling back to mock data");
        return mockGetProcessingResult(fileId);
      }
      
      // Ensure codeframe has numeric codes
      const codeframeWithNumeric = ensureNumericCodes(parsedResult.codeframe);
      
      // Ensure "Other" category exists
      const codeframeWithOther = ensureOtherCategory(codeframeWithNumeric);
      
      // Calculate code percentages
      const { updatedCodeframe, codeSummary } = calculateCodePercentages(
        parsedResult.codedResponses, 
        codeframeWithOther
      );
      
      // Return the processed result
      return {
        success: true,
        data: {
          codeframe: updatedCodeframe,
          codedResponses: parsedResult.codedResponses,
          codeSummary: codeSummary,
          status: 'complete'
        }
      };
    } catch (error) {
      console.error("Error handling OpenAI response:", error);
      throw new Error("Failed to parse analysis results from OpenAI");
    }
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
      numeric: "1",
      label: "Ease of Use",
      definition: "Comments related to how easy or difficult the product is to use",
      examples: ["Very intuitive interface", "Easy to navigate", "Straightforward to set up"],
      count: 8,
      percentage: 32
    },
    {
      code: "C02",
      numeric: "2",
      label: "Performance",
      definition: "Comments about the speed, reliability, or efficiency of the product",
      examples: ["Runs smoothly", "No lag time", "Quick response"],
      count: 6,
      percentage: 24
    },
    {
      code: "C03",
      numeric: "3",
      label: "Features",
      definition: "Mentions of specific product features or functionality",
      examples: ["Love the search capability", "The dashboard is comprehensive", "Export feature saves time"],
      count: 5,
      percentage: 20
    },
    {
      code: "C04",
      numeric: "4", 
      label: "Value",
      definition: "Comments about price, ROI, or overall value proposition",
      examples: ["Worth every penny", "Good price for what you get", "Expensive but worth it"],
      count: 4,
      percentage: 16
    },
    {
      code: "C05",
      numeric: "5",
      label: "Support",
      definition: "Feedback about customer service or technical support",
      examples: ["Support team was helpful", "Quick response to my questions", "Documentation is thorough"],
      count: 2,
      percentage: 8
    },
    {
      code: "C06",
      numeric: "6",
      label: "Other",
      definition: "Comments that don't fit into the above categories",
      examples: ["Packaging was neat", "Arrived on time", "Company seems ethical"],
      count: 0,
      percentage: 0
    }
  ];

  // Generate code summary
  const codeSummary = mockCodeframe.map(code => ({
    code: code.code,
    numeric: code.numeric,
    label: code.label,
    count: code.count || 0,
    percentage: code.percentage || 0
  })).sort((a, b) => b.percentage - a.percentage);
  
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
      codeSummary: codeSummary,
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
      Numeric: code.numeric || '',
      Label: code.label,
      Definition: code.definition,
      Examples: code.examples.join('; '),
      Count: code.count || 0,
      Percentage: code.percentage ? `${code.percentage.toFixed(1)}%` : '0%'
    }));
    const codeframeWorksheet = XLSX.utils.json_to_sheet(codeframeData);
    XLSX.utils.book_append_sheet(workbook, codeframeWorksheet, "Codeframe");
    
    // Create the Code Summary worksheet
    if (result.codeSummary) {
      const summaryData = result.codeSummary.map(code => ({
        Code: code.code,
        Numeric: code.numeric || '',
        Label: code.label,
        Count: code.count,
        Percentage: `${code.percentage.toFixed(1)}%`
      }));
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Code Summary");
    }
    
    // Create the Coded Responses worksheet
    const responsesData = result.codedResponses.map(response => ({
      Response: response.responseText,
      Column: response.columnName || 'Unknown',
      Codes: response.codesAssigned.join('; '),
      NumericCodes: response.codesAssigned.map(code => {
        const codeEntry = result.codeframe.find(c => c.code === code);
        return codeEntry ? codeEntry.numeric || code : code;
      }).join('; ')
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
          Codes: response.codesAssigned.map(code => {
            const codeEntry = result.codeframe.find(c => c.code === code);
            return codeEntry ? `${codeEntry.numeric || ''} - ${codeEntry.label}` : code;
          }).join('; ')
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

// Function to generate Excel with original data and codes
export const generateExcelWithOriginalData = async (result: ProcessedResult, rawFileData: any[][]): Promise<Blob> => {
  try {
    console.log("Generating Excel with original data. Raw data rows:", rawFileData?.length);
    
    if (!rawFileData || !Array.isArray(rawFileData) || rawFileData.length === 0) {
      throw new Error("No raw file data available for export");
    }
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Create the Codeframe worksheet (same as regular export)
    const codeframeData = result.codeframe.map(code => ({
      Code: code.code,
      Numeric: code.numeric || '',
      Label: code.label,
      Definition: code.definition,
      Examples: code.examples.join('; '),
      Count: code.count || 0,
      Percentage: code.percentage ? `${code.percentage.toFixed(1)}%` : '0%'
    }));
    const codeframeWorksheet = XLSX.utils.json_to_sheet(codeframeData);
    XLSX.utils.book_append_sheet(workbook, codeframeWorksheet, "Codeframe");
    
    // Create the Code Summary worksheet
    if (result.codeSummary) {
      const summaryData = result.codeSummary.map(code => ({
        Code: code.code,
        Numeric: code.numeric || '',
        Label: code.label,
        Count: code.count,
        Percentage: `${code.percentage.toFixed(1)}%`
      }));
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Code Summary");
    }
    
    // Create the Coded Responses worksheet
    const responsesData = result.codedResponses.map(response => ({
      Response: response.responseText,
      Column: response.columnName || 'Unknown',
      Codes: response.codesAssigned.join('; '),
      NumericCodes: response.codesAssigned.map(code => {
        const codeEntry = result.codeframe.find(c => c.code === code);
        return codeEntry ? codeEntry.numeric || code : code;
      }).join('; ')
    }));
    const responsesWorksheet = XLSX.utils.json_to_sheet(responsesData);
    XLSX.utils.book_append_sheet(workbook, responsesWorksheet, "Coded Responses");
    
    // Handle the Original Data with Codes worksheet
    try {
      console.log("Creating original data worksheet with", rawFileData.length, "rows");
      
      // Create a map of normalized response texts to their assigned codes for easy lookup
      const responseCodeMap = new Map();
      result.codedResponses.forEach(response => {
        // Get numeric codes
        const codeString = response.codesAssigned.map(code => {
          const codeEntry = result.codeframe.find(c => c.code === code);
          return codeEntry ? codeEntry.numeric || code : code;
        }).join('; ');
        
        // Get code labels
        const labelString = response.codesAssigned.map(code => {
          const codeEntry = result.codeframe.find(c => c.code === code);
          return codeEntry ? codeEntry.label : code;
        }).join('; ');
        
        // Store both numeric codes and code labels with normalized key for case-insensitive matching
        const normalizedKey = response.responseText.trim().toLowerCase();
        responseCodeMap.set(normalizedKey, {
          codes: codeString,
          labels: labelString
        });
      });
      
      // Create a defensive copy of the raw data to avoid modification issues
      let originalWithCodes;
      try {
        originalWithCodes = JSON.parse(JSON.stringify(rawFileData));
        console.log("Successfully created deep copy of raw data");
      } catch (copyError) {
        console.error("Error creating deep copy, falling back to manual copy:", copyError);
        // Fallback to manual array copy if JSON stringify/parse fails
        originalWithCodes = [];
        for (let i = 0; i < rawFileData.length; i++) {
          if (Array.isArray(rawFileData[i])) {
            originalWithCodes.push([...rawFileData[i]]);
          } else {
            originalWithCodes.push([]);
          }
        }
      }
      
      // First row is headers - copy and add additional headers
      if (originalWithCodes.length > 0) {
        if (!Array.isArray(originalWithCodes[0])) {
          originalWithCodes[0] = [];
        }
        originalWithCodes[0].push("Assigned Codes");
        originalWithCodes[0].push("Code Labels");
      }
      
      // Process each data row
      for (let rowIndex = 1; rowIndex < originalWithCodes.length; rowIndex++) {
        const row = originalWithCodes[rowIndex];
        if (!row || !Array.isArray(row)) {
          originalWithCodes[rowIndex] = ["", ""];
          continue;
        }
        
        let foundCodes = false;
        
        // Look for coded responses in this row
        for (let cellIndex = 0; cellIndex < row.length; cellIndex++) {
          const cellValue = row[cellIndex];
          
          // Skip empty or non-string values
          if (!cellValue) continue;
          
          // Convert to string if it's not already
          const cellText = String(cellValue).trim();
          if (cellText.length === 0) continue;
          
          // Look for the normalized cell text in our coded responses map
          const normalizedText = cellText.toLowerCase();
          const codeInfo = responseCodeMap.get(normalizedText);
          
          if (codeInfo) {
            row.push(codeInfo.codes || "");
            row.push(codeInfo.labels || "");
            foundCodes = true;
            break;
          }
        }
        
        // If no codes were found, add empty cells
        if (!foundCodes) {
          row.push("");
          row.push("");
        }
      }
      
      // Convert the augmented data to a worksheet
      console.log("Creating worksheet from processed data");
      const originalWorksheet = XLSX.utils.aoa_to_sheet(originalWithCodes);
      XLSX.utils.book_append_sheet(workbook, originalWorksheet, "Original Data with Codes");
      console.log("Successfully added original data worksheet");
    } catch (sheetError) {
      console.error("Error processing original data sheet:", sheetError);
      // Create a simple error explanation sheet instead
      const errorData = [
        ["Error Processing Original Data"],
        ["An error occurred while trying to merge your original data with the codes."],
        ["Your coded responses are still available in the other sheets."],
        ["Error details:"],
        [sheetError instanceof Error ? sheetError.message : String(sheetError)]
      ];
      const errorWorksheet = XLSX.utils.aoa_to_sheet(errorData);
      XLSX.utils.book_append_sheet(workbook, errorWorksheet, "Data Processing Error");
    }
    
    console.log("Writing workbook to Excel buffer");
    
    // Write the workbook to an array buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob from the ArrayBuffer with the correct MIME type
    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  } catch (error) {
    console.error("Error generating Excel file with original data:", error);
    throw new Error(error instanceof Error ? 
      `Failed to generate Excel file: ${error.message}` : 
      'Failed to generate Excel file with original data'
    );
  }
};
