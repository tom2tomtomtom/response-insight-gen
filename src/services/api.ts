import { ApiResponse, ProcessedResult, UploadedFile, ColumnInfo, UploadedCodeframe } from "../types";
import * as XLSX from 'xlsx';

// Default API endpoint for the text analysis service
const DEFAULT_API_URL = "https://api.openai.com/v1/chat/completions";

// Store selected columns for processing
let userSelectedColumns: ColumnInfo[] = [];

// Store uploaded codeframe if provided
let userUploadedCodeframe: UploadedCodeframe | null = null;

// Store column question types
let userColumnQuestionTypes: Record<number, string> = {};

// Set selected columns - renamed to avoid naming conflicts in ProcessingContext
export const setApiSelectedColumns = (columns: ColumnInfo[]): void => {
  userSelectedColumns = columns;
};

// Set uploaded codeframe for use in API
export const setUploadedCodeframe = (codeframe: UploadedCodeframe | null): void => {
  userUploadedCodeframe = codeframe;
};

// Set column question types
export const setColumnQuestionTypes = (columnTypes: Record<number, string>): void => {
  userColumnQuestionTypes = columnTypes;
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

// Generate codeframe for a specific question type
const generatePromptByQuestionType = (questionType: string, columns: any[], uploadedCodeframe: UploadedCodeframe | null) => {
  let promptContent = "";
  
  // If user uploaded a codeframe, include it in the prompt
  if (uploadedCodeframe) {
    promptContent = `I have a survey with the following open-ended questions and responses:
    ${JSON.stringify(columns, null, 2)}
    
    I already have a predefined codeframe that I want you to use to code these responses:
    ${JSON.stringify(uploadedCodeframe.entries, null, 2)}
    
    Please analyze these responses and:
    1. Use ONLY the provided codeframe codes - do not create new ones
    2. Assign the appropriate codes to each response based on the definitions in the codeframe
    3. Make sure to include the "Other" category for responses that don't fit any category
    
    Format your response as a JSON object with two properties:
    - codeframe: The provided codeframe array of code objects with {code, numeric, label, definition, examples}
    - codedResponses: An array of response objects with {responseText, columnName, columnIndex, codesAssigned}`;
    
    return promptContent;
  }

  // Create different prompts based on question type
  switch (questionType) {
    case 'brand_awareness':
      promptContent = `I have survey responses from Unaided Brand Awareness questions where respondents listed brands they are aware of:
      ${JSON.stringify(columns, null, 2)}
      
      Please analyze these responses and:
      1. Create a codeframe with distinct brand codes
      2. Group related brands under parent systems/categories where appropriate
      3. Include an "Other" category for mentions that don't fit main brands
      4. For each code, provide:
         - A short label (the brand name)
         - A clear definition including parent company if applicable
         - A numeric code
         - Sample mentions that would be coded to this brand
      5. If you detect brand hierarchies, create parent codes (e.g., "Hospital System") and child codes (individual hospitals)
      
      Format your response as a JSON object with:
      - codeframe: Array of code objects with {code, numeric, label, definition, examples, parentCode}
      - codedResponses: Array of response objects with {responseText, columnName, columnIndex, codesAssigned}
      - brandHierarchies: Object mapping parent codes to arrays of child codes`;
      break;
      
    case 'brand_description':
      promptContent = `I have survey responses from Brand Description questions where respondents described brands:
      ${JSON.stringify(columns, null, 2)}
      
      Please analyze these responses and:
      1. Create a codeframe with attribute categories (like Quality, Value, Innovation)
      2. Include sentiment dimensions (Positive, Negative, Neutral) where appropriate
      3. Always include an "Other" category
      4. For each code, provide:
         - A short label for the attribute
         - A clear definition of what this attribute represents
         - A numeric code
         - Example phrases from the responses
      5. Group related attributes under themes where possible
      
      Format your response as a JSON object with:
      - codeframe: Array of code objects with {code, numeric, label, definition, examples, themeGroup}
      - codedResponses: Array of objects with {responseText, columnName, columnIndex, codesAssigned}
      - attributeThemes: Object mapping themes to arrays of attribute codes`;
      break;
      
    case 'miscellaneous':
    default:
      promptContent = `I have a survey with the following open-ended questions and responses:
      ${JSON.stringify(columns, null, 2)}
      
      Please analyze these responses and:
      1. Create a codeframe with 5-10 distinct codes using numeric identifiers
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
  
  return promptContent;
};

// Generate insights based on coded results
const generateInsightsPrompt = (questionTypes: string[], codedResponses: any, codeframes: any) => {
  return `Based on the analysis of the survey responses across ${questionTypes.length} question types:
  
  ${JSON.stringify({questionTypes, codedResponses, codeframes}, null, 2)}
  
  Please provide a high-level summary of key findings and insights:
  1. For each question type, identify the top 3-5 themes/patterns
  2. Highlight any notable correlations or contrasts between different question types
  3. Summarize the overall sentiment and main takeaways from the responses
  4. Suggest potential follow-up areas for deeper analysis
  
  Format your response as markdown text with clear section headers for each question type.`;
};

// Get the processing result with multiple codeframes
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
    
    // Group columns by question type
    const columnsByType: Record<string, any[]> = {};
    
    for (const columnInfo of userSelectedColumns) {
      const questionType = userColumnQuestionTypes[columnInfo.index] || 'miscellaneous';
      
      if (!columnsByType[questionType]) {
        columnsByType[questionType] = [];
      }
      
      // Get all responses for this column, not just examples
      const columnData = {
        name: columnInfo.name,
        index: columnInfo.index,
        responses: columnInfo.examples || [],
        settings: columnInfo.settings || {} // Include any settings like hasNets
      };
      
      columnsByType[questionType].push(columnData);
    }
    
    console.log("Columns grouped by question type:", Object.keys(columnsByType));
    
    // Process each question type separately
    const promises = Object.entries(columnsByType).map(async ([questionType, columns]) => {
      // Create a prompt for this question type
      const promptContent = generatePromptByQuestionType(questionType, columns, userUploadedCodeframe);
      
      const messages = [
        {
          role: "system",
          content: `You are an expert qualitative researcher analyzing ${questionType} type survey responses.`
        },
        {
          role: "user",
          content: promptContent
        }
      ];
      
      // Make the API call to OpenAI
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
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.message || `Processing failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      try {
        // Parse the content from the OpenAI response
        const content = data.choices[0].message.content;
        let parsedResult;
        
        try {
          parsedResult = JSON.parse(content);
        } catch (jsonError) {
          console.error("Failed to parse JSON for question type", questionType, jsonError);
          return null;
        }
        
        // Validate the parsed result structure
        if (!parsedResult.codeframe || !Array.isArray(parsedResult.codeframe) || 
            !parsedResult.codedResponses || !Array.isArray(parsedResult.codedResponses)) {
          console.warn("OpenAI response doesn't have the expected structure for question type", questionType);
          return null;
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
        
        // Return the processed result for this question type
        return {
          questionType,
          codeframe: updatedCodeframe,
          codedResponses: parsedResult.codedResponses,
          codeSummary: codeSummary,
          // Include special data if available
          brandHierarchies: parsedResult.brandHierarchies,
          attributeThemes: parsedResult.attributeThemes
        };
      } catch (error) {
        console.error("Error handling OpenAI response for question type", questionType, error);
        return null;
      }
    });
    
    // Wait for all question types to be processed
    const results = (await Promise.all(promises)).filter(Boolean);
    
    if (results.length === 0) {
      throw new Error("Failed to process any question types");
    }
    
    // Combine results from all question types
    const allCodedResponses: any[] = [];
    const multipleCodeframes: Record<string, any> = {};
    
    results.forEach(result => {
      if (!result) return;
      
      // Add these coded responses to the combined list
      allCodedResponses.push(...result.codedResponses);
      
      // Store the codeframe and summary by question type
      multipleCodeframes[result.questionType] = {
        codeframe: result.codeframe,
        codeSummary: result.codeSummary,
        brandHierarchies: result.brandHierarchies,
        attributeThemes: result.attributeThemes
      };
    });
    
    // Use the first result as the "primary" one for backward compatibility
    const primaryResult = results[0];
    
    // Generate insights if there are multiple question types
    let insights = null;
    if (results.length > 1) {
      try {
        // Generate insights across question types
        const insightsPrompt = generateInsightsPrompt(
          Object.keys(multipleCodeframes),
          allCodedResponses,
          multipleCodeframes
        );
        
        const insightsResponse = await fetch(`${apiConfig.apiUrl || DEFAULT_API_URL}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are an expert data analyst providing insights on survey results."
              },
              {
                role: "user",
                content: insightsPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });
        
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          insights = insightsData.choices[0].message.content;
        }
      } catch (error) {
        console.error("Failed to generate insights:", error);
        // Continue without insights if generation fails
      }
    }
    
    // Return the combined result
    return {
      success: true,
      data: {
        // Primary codeframe and responses for backward compatibility
        codeframe: primaryResult.codeframe,
        codedResponses: allCodedResponses,
        codeSummary: primaryResult.codeSummary,
        // New multi-codeframe structure
        multipleCodeframes,
        insights,
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

// Function to generate an Excel file from the results with multiple codeframes
export const generateExcelFile = async (result: ProcessedResult): Promise<Blob> => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Check for multiple codeframes
    const hasMultipleCodeframes = result.multipleCodeframes && 
      Object.keys(result.multipleCodeframes).length > 0;
    
    // Add overall summary tab if we have insights
    if (result.insights) {
      // Convert the insights markdown to a format suitable for Excel
      const insightRows = result.insights.split('\n').map(line => [line]);
      const insightsWorksheet = XLSX.utils.aoa_to_sheet(insightRows);
      XLSX.utils.book_append_sheet(workbook, insightsWorksheet, "Analysis Insights");
    }
    
    // If we have multiple codeframes, create a worksheet for each question type
    if (hasMultipleCodeframes) {
      Object.entries(result.multipleCodeframes).forEach(([questionType, typeData]) => {
        // Create readable question type name
        const questionTypeName = questionType === 'brand_awareness' ? 'Brand Awareness' : 
                                questionType === 'brand_description' ? 'Brand Description' : 
                                'Miscellaneous';
                                
        // Create codeframe worksheet for this question type
        if (typeData.codeframe) {
          const codeframeData = typeData.codeframe.map((code: any) => ({
            Code: code.code,
            Numeric: code.numeric || '',
            Label: code.label,
            Definition: code.definition,
            Examples: (code.examples || []).join('; '),
            Count: code.count || 0,
            Percentage: code.percentage ? `${code.percentage.toFixed(1)}%` : '0%',
            ...(code.parentCode ? { ParentCode: code.parentCode } : {}),
            ...(code.themeGroup ? { Theme: code.themeGroup } : {})
          }));
          
          const typeCodeframeWorksheet = XLSX.utils.json_to_sheet(codeframeData);
          XLSX.utils.book_append_sheet(workbook, typeCodeframeWorksheet, `${questionTypeName} Codes`);
        }
        
        // Create code summary worksheet for this question type
        if (typeData.codeSummary) {
          const summaryData = typeData.codeSummary.map((code: any) => ({
            Code: code.code,
            Numeric: code.numeric || '',
            Label: code.label,
            Count: code.count,
            Percentage: `${code.percentage.toFixed(1)}%`
          }));
          
          const typeSummaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(workbook, typeSummaryWorksheet, `${questionTypeName} Summary`);
        }
        
        // Add brand hierarchies if available
        if (questionType === 'brand_awareness' && typeData.brandHierarchies) {
          const hierarchyData: any[] = [];
          
          Object.entries(typeData.brandHierarchies).forEach(([parent, children]) => {
            hierarchyData.push({ ParentSystem: parent, ChildBrand: '', Count: '' });
            (children as string[]).forEach(child => {
              const childCode = typeData.codeframe.find((c: any) => c.code === child);
              hierarchyData.push({ 
                ParentSystem: '',
                ChildBrand: childCode?.label || child,
                Count: childCode?.count || 0
              });
            });
          });
          
          if (hierarchyData.length > 0) {
            const hierarchyWorksheet = XLSX.utils.json_to_sheet(hierarchyData);
            XLSX.utils.book_append_sheet(workbook, hierarchyWorksheet, "Brand Hierarchies");
          }
        }
        
        // Add attribute themes if available
        if (questionType === 'brand_description' && typeData.attributeThemes) {
          const themeData: any[] = [];
          
          Object.entries(typeData.attributeThemes).forEach(([theme, attributes]) => {
            themeData.push({ Theme: theme, Attribute: '', Count: '' });
            (attributes as string[]).forEach(attr => {
              const attrCode = typeData.codeframe.find((c: any) => c.code === attr);
              themeData.push({ 
                Theme: '',
                Attribute: attrCode?.label || attr,
                Count: attrCode?.count || 0
              });
            });
          });
          
          if (themeData.length > 0) {
            const themeWorksheet = XLSX.utils.json_to_sheet(themeData);
            XLSX.utils.book_append_sheet(workbook, themeWorksheet, "Attribute Themes");
          }
        }
      });
    } else {
      // If no multiple codeframes, keep the original codeframe worksheet
      const codeframeData = result.codeframe.map(code => ({
        Code: code.code,
        Numeric: code.numeric || '',
        Label: code.label,
        Definition: code.definition,
        Examples: (code.examples || []).join('; '),
        Count: code.count || 0,
        Percentage: code.percentage ? `${code.percentage.toFixed(1)}%` : '0%'
      }));
      
      const codeframeWorksheet = XLSX.utils.json_to_sheet(codeframeData);
      XLSX.utils.book_append_sheet(workbook, codeframeWorksheet, "Codeframe");
      
      // Add the Code Summary worksheet if available
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
    }
    
    // Create the Coded Responses worksheet (this always contains all responses)
    const responsesData = result.codedResponses.map(response => ({
      Response: response.responseText,
      Column: response.columnName || 'Unknown',
      QuestionType: hasMultipleCodeframes ? 
        userColumnQuestionTypes[response.columnIndex] || 'miscellaneous' : 
        'N/A',
      Codes: response.codesAssigned.join('; '),
      NumericCodes: response.codesAssigned.map(code => {
        // Find the code in the appropriate codeframe based on question type
        const questionType = hasMultipleCodeframes ? 
          userColumnQuestionTypes[response.columnIndex] || 'miscellaneous' :
          '';
          
        let codeEntry;
        if (hasMultipleCodeframes && questionType && result.multipleCodeframes[questionType]) {
          codeEntry = result.multipleCodeframes[questionType].codeframe.find((c: any) => c.code === code);
        } else {
          codeEntry = result.codeframe.find(c => c.code === code);
        }
        
        return codeEntry ? codeEntry.numeric || code : code;
      }).join('; ')
    }));
    
    const responsesWorksheet = XLSX.utils.json_to_sheet(responsesData);
    XLSX.utils.book_append_sheet(workbook, responsesWorksheet, "Coded Responses");
    
    // Create column-specific worksheets
    const columnResponses = new Map<string, any[]>();
    
    // Group responses by column
    result.codedResponses.forEach(response => {
      if (response.columnName) {
        const key = response.columnName;
        if (!columnResponses.has(key)) {
          columnResponses.set(key, []);
        }
        
        // Determine which codeframe to use for this response
        const questionType = hasMultipleCodeframes ? 
          userColumnQuestionTypes[response.columnIndex] || 'miscellaneous' :
          '';
          
        const codes = response.codesAssigned.map(code => {
          let codeEntry;
          if (hasMultipleCodeframes && questionType && result.multipleCodeframes[questionType]) {
            codeEntry = result.multipleCodeframes[questionType].codeframe.find((c: any) => c.code === code);
          } else {
            codeEntry = result.codeframe.find(c => c.code === code);
          }
          
          return codeEntry ? `${codeEntry.numeric || ''} - ${codeEntry.label}` : code;
        }).join('; ');
        
        columnResponses.get(key)?.push({
          Response: response.responseText,
          QuestionType: hasMultipleCodeframes ? 
            (questionType === 'brand_awareness' ? 'Brand Awareness' : 
             questionType === 'brand_description' ? 'Brand Description' : 
             'Miscellaneous') : 
            'N/A',
          Codes: codes
        });
      }
    });
    
    // Create a worksheet for each column
    columnResponses.forEach((responses, columnName) => {
      const safeSheetName = columnName.substring(0, 30).replace(/[*?[\]]/g, '_');
      const worksheet = XLSX.utils.json_to_sheet(responses);
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
    });
    
    // Write the workbook to an array buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob from the ArrayBuffer
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
    console.log("Starting Excel generation with original data. Raw data rows:", rawFileData?.length);
    
    // Step 1: Validate input data - must be strict
    if (!rawFileData || !Array.isArray(rawFileData) || rawFileData.length === 0) {
      throw new Error("No raw file data available for export");
    }
    
    // Step 2: Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Step 3: Create the Codeframe worksheet - small data, safe to add first
    const codeframeData = result.codeframe.map(code => ({
      Code: code.code,
      Numeric: code.numeric || '',
      Label: code.label,
      Definition: code.definition,
      Examples: (code.examples || []).join('; '),
      Count: code.count || 0,
      Percentage: code.percentage ? `${code.percentage.toFixed(1)}%` : '0%'
    }));
    
    const codeframeWorksheet = XLSX.utils.json_to_sheet(codeframeData);
    XLSX.utils.book_append_sheet(workbook, codeframeWorksheet, "Codeframe");
    
    // Step 4: Add the Code Summary worksheet - also small data
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
    
    // Step 5: Create the Coded Responses worksheet - medium sized data
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
    
    // Step 6: Process original data with codes - completely new approach
    try {
      console.log("Creating original data worksheet with memory-efficient approach");
      
      // 6.1: Build normalized lookup map for response matching - critical for performance
      const responseCodeMap = new Map();
      
      // Only include necessary data in the map to reduce memory usage
      result.codedResponses.forEach(response => {
        if (!response || !response.responseText) return;
        
        // Get codes and labels as strings
        const codes = (response.codesAssigned || [])
          .map(code => {
            const codeEntry = result.codeframe.find(c => c.code === code);
            return codeEntry ? (codeEntry.numeric || code) : code;
          })
          .join('; ');
        
        const labels = (response.codesAssigned || [])
          .map(code => {
            const codeEntry = result.codeframe.find(c => c.code === code);
            return codeEntry ? codeEntry.label : code;
          })
          .join('; ');
        
        // Store normalized key for case-insensitive matching
        const normalizedKey = response.responseText.trim().toLowerCase();
        if (normalizedKey) {
          responseCodeMap.set(normalizedKey, { codes, labels });
        }
      });
      
      console.log(`Created response code map with ${responseCodeMap.size} entries`);
      
      // 6.2: Don't pre-allocate the entire array - process in chunks
      const MAX_ROWS = 50000; // Limit to prevent memory issues
      const CHUNK_SIZE = 1000; // Process chunks of rows at a time
      
      // Get headers first
      const headers = Array.isArray(rawFileData[0]) ? [...rawFileData[0], "Assigned Codes", "Code Labels"] : ["Assigned Codes", "Code Labels"];
      const headerSheet = XLSX.utils.aoa_to_sheet([headers]);
      XLSX.utils.book_append_sheet(workbook, headerSheet, "Original Data with Codes");
      
      // Process data in chunks to avoid memory issues
      let processedRows = 0;
      let matchCount = 0;
      
      // Only process at most MAX_ROWS to avoid crashes
      const rowsToProcess = Math.min(rawFileData.length, MAX_ROWS);
      
      for (let chunkStart = 1; chunkStart < rowsToProcess; chunkStart += CHUNK_SIZE) {
        // Process each chunk
        const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, rowsToProcess);
        const chunk = [];
        
        for (let i = chunkStart; i < chunkEnd; i++) {
          const row = rawFileData[i];
          if (!Array.isArray(row)) continue;
          
          // Create a new row with assignment info
          const newRow = [...row]; // Shallow copy is sufficient here
          let foundMatch = false;
          
          // Try to find a coded response match in this row
          for (let j = 0; j < row.length; j++) {
            if (row[j] === null || row[j] === undefined) continue;
            
            // Convert to string and normalize
            const cellText = String(row[j]).trim();
            if (!cellText) continue;
            
            // Check for match using normalized version
            const normalizedText = cellText.toLowerCase();
            const match = responseCodeMap.get(normalizedText);
            
            if (match) {
              newRow.push(match.codes || "");
              newRow.push(match.labels || "");
              foundMatch = true;
              matchCount++;
              break;
            }
          }
          
          if (!foundMatch) {
            newRow.push("");  // No codes
            newRow.push("");  // No labels
          }
          
          chunk.push(newRow);
          processedRows++;
        }
        
        // Add chunk to worksheet, with offset for header
        XLSX.utils.sheet_add_aoa(headerSheet, chunk, { origin: -1 }); // -1 means append
        
        // Free memory
        chunk.length = 0;
      }
      
      console.log(`Processed ${processedRows} rows, found matches for ${matchCount} rows`);
      
    } catch (sheetError) {
      console.error("Error processing original data sheet:", sheetError);
      
      // Create an error explanation sheet instead
      const errorData = [
        ["Error Processing Original Data"],
        ["There was a problem processing your original data file:"],
        [sheetError instanceof Error ? sheetError.message : String(sheetError)],
        [""],
        ["Your coded responses are still available in the other sheets."],
        ["Try one of these solutions:"],
        ["1. Use 'Coded responses only' option instead"],
        ["2. Try with a smaller dataset"],
        ["3. Contact support if the problem persists"]
      ];
      
      const errorWorksheet = XLSX.utils.aoa_to_sheet(errorData);
      XLSX.utils.book_append_sheet(workbook, errorWorksheet, "Processing Error");
    }
    
    // Step 7: Write the complete workbook to Excel
    console.log("Writing workbook to Excel buffer with compression");
    
    try {
      // Use compression and efficient write options
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array',
        compression: true
      });
      
      return new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
    } catch (writeError) {
      console.error("Failed in final Excel generation step:", writeError);
      throw new Error("Failed to generate Excel file due to memory limitations. Try with a smaller dataset.");
    }
  } catch (error) {
    console.error("Error in Excel generation:", error);
    throw error instanceof Error ? error : new Error('Unknown error occurred during Excel generation');
  }
};
